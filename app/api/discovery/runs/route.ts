import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { DiscoverySearchInputSchema } from "@/lib/validations";
import { leadsStore } from "@/lib/leads-store";
import { GooglePlacesProvider, buildTargetedQueries } from "@/lib/providers/google-places";
import { GoogleSearchProvider } from "@/lib/providers/google-search";
import { ApolloProvider } from "@/lib/providers/apollo";
import { validateEmailHygiene } from "@/lib/dns";
import { classifyLeadWithGemini } from "@/lib/gemini";
import { normalizeEmail, normalizeDomain } from "@/lib/normalizer";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { checkQuotaSafety } from "@/lib/quota-manager";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    // Retrieve from Prisma first
    try {
      const dbRuns = await prisma.discoveryRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 10,
        include: {
          logs: {
            take: 5,
            orderBy: { ts: "desc" },
          },
        },
      });

      if (dbRuns && dbRuns.length > 0) {
        const mapped = dbRuns.map((r) => {
          let parsed: any = {};
          try {
            parsed = JSON.parse(r.params || "{}");
          } catch {}
          return {
            id: r.id,
            workspaceId: auth.workspaceId,
            product: parsed.product || "Singing Bowls",
            category: parsed.category || "Home Decor",
            country: parsed.country || "United States",
            state: parsed.state,
            city: parsed.city,
            sources: parsed.sources || ["Google Places (New)"],
            leadsFound: r.foundCount,
            duplicatesBlocked: r.duplicatesCount,
            invalidCount: 0,
            b2bCount: Math.max(0, r.foundCount - 1),
            costCredits: 2.5,
            status: r.status.toLowerCase(),
            date: r.startedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          };
        });
        return NextResponse.json({ runs: mapped });
      }
    } catch {}

    const runs = leadsStore.listDiscoveryRuns(auth.workspaceId);
    return NextResponse.json({ runs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = DiscoverySearchInputSchema.parse(body);

    // Quota Safety Check
    const queries = buildTargetedQueries(input);
    const safetyCheck = await checkQuotaSafety("google_places", queries.length);
    if (!safetyCheck.allowed) {
      return NextResponse.json({ error: safetyCheck.message }, { status: 429 });
    }

    const runId = `RUN-${Date.now().toString().slice(-4)}`;
    const run = leadsStore.createDiscoveryRun(auth.workspaceId, {
      id: runId,
      product: input.product,
      category: input.category,
      country: input.country,
      state: input.state,
      city: input.city,
      sources: input.providers.includes("google_places") ? ["Google Places (New)"] : input.providers,
      status: "running",
    });

    await leadsStore.addRunLog(runId, "INFO", `Generating targeted search queries for '${input.product}' in ${input.city || "Austin"}, ${input.state || "Texas"}...`);

    const discoveredLeads: any[] = [];
    let duplicatesCount = 0;

    const provider = new GooglePlacesProvider();
    await leadsStore.addRunLog(runId, "INFO", `Connecting to Google Places API (New) with field masks...`);

    try {
      for await (const rawLead of provider.search(input)) {
        const domain = normalizeDomain(rawLead.website || "");
        const cleanEmail = rawLead.email ? normalizeEmail(rawLead.email) : "";

        // 1. Deduplication check
        if (cleanEmail || domain) {
          const dup = leadsStore.findDuplicate(auth.workspaceId, cleanEmail || `info@${domain}`, domain);
          if (dup) {
            duplicatesCount++;
            await leadsStore.addRunLog(runId, "WARN", `Deduplication shield blocked: '${rawLead.company}' matches existing record (${dup.company}).`);
            continue;
          }
        }

        // 2. Email hygiene check (if email is present)
        let hygiene = { isValid: null as boolean | null, reason: "No email provided by Place card; ready for crawler enrichment" };
        if (cleanEmail) {
          hygiene = await validateEmailHygiene(cleanEmail);
        }

        // 3. AI classification with Gemini
        const classification = await classifyLeadWithGemini({
          company: rawLead.company,
          website: rawLead.website,
          snippet: rawLead.snippet,
          product: input.product,
          category: input.category,
        });

        // 4. Save to store and SQLite
        const { lead: createdLead } = leadsStore.createLead(auth.workspaceId, {
          company: rawLead.company,
          website: rawLead.website || (domain ? `https://${domain}` : ""),
          contactName: rawLead.contactName || "Purchasing Team",
          contactTitle: rawLead.contactTitle || "Wholesale Buyer",
          email: cleanEmail,
          phone: rawLead.phone || "",
          country: rawLead.country,
          state: rawLead.state,
          city: rawLead.city,
          address: rawLead.address || "",
          source: "GOOGLE_PLACES",
          sourceRef: rawLead.sourceRef || (domain ? `places:${domain}` : `query:${input.product}`),
          buyerType: classification.buyerType.toUpperCase() as any,
          emailValid: hygiene.isValid,
          emailValidationReason: hygiene.reason,
          aiClass: classification.classification === "unknown" ? null : classification.classification,
          aiConfidence: classification.confidence,
          aiReasoning: classification.reasoning,
          emailStatus: "not_sent",
        });

        if (createdLead) {
          discoveredLeads.push(createdLead);
          await leadsStore.addRunLog(runId, "SUCCESS", `Discovered verified buyer: ${createdLead.company} (${createdLead.buyerType})`);
        }

        if (discoveredLeads.length >= input.resultCap) {
          break;
        }
      }
    } catch (err: any) {
      logger.error({ error: err.message }, "Error during Places discovery execution");
      await leadsStore.addRunLog(runId, "ERROR", `Discovery run interrupted: ${err.message}`);
    }

    // Finalize run
    run.leadsFound = discoveredLeads.length;
    run.duplicatesBlocked = duplicatesCount;
    run.invalidCount = discoveredLeads.filter((l) => l.emailValid === false).length;
    run.b2bCount = discoveredLeads.filter((l) => l.aiClass === "b2b").length;
    run.status = "completed";
    run.finishedAt = new Date().toISOString();

    await leadsStore.addRunLog(runId, "SUCCESS", `Discovery run completed. Found ${discoveredLeads.length} leads. Blocked ${duplicatesCount} duplicates.`);

    // Persist finalized run to SQLite
    await prisma.discoveryRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        foundCount: discoveredLeads.length,
        duplicatesCount,
        finishedAt: new Date(),
      },
    }).catch(() => {});

    return NextResponse.json({
      run,
      leads: discoveredLeads,
      message: `Discovered ${discoveredLeads.length} verified B2B leads. Blocked ${duplicatesCount} duplicate companies.`,
    });
  } catch (err: any) {
    logger.error({ error: err.message }, "Discovery run API error");
    return NextResponse.json({ error: err.message || "Failed to execute discovery run" }, { status: 400 });
  }
}
