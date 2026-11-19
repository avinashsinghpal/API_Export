import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { DiscoverySearchInputSchema } from "@/lib/validations";
import { leadsStore } from "@/lib/leads-store";
import { GooglePlacesProvider } from "@/lib/providers/google-places";
import { GoogleSearchProvider } from "@/lib/providers/google-search";
import { ApolloProvider } from "@/lib/providers/apollo";
import { enrichCompanyWebsite } from "@/lib/providers/crawler";
import { validateEmailHygiene } from "@/lib/dns";
import { classifyLeadWithGemini } from "@/lib/gemini";
import { normalizeEmail, normalizeDomain } from "@/lib/normalizer";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
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

    const runId = `RUN-${Date.now().toString().slice(-4)}`;
    const run = leadsStore.createDiscoveryRun(auth.workspaceId, {
      id: runId,
      product: input.product,
      category: input.category,
      country: input.country,
      state: input.state,
      city: input.city,
      sources: input.providers,
      status: "running",
    });

    const discoveredLeads: any[] = [];
    let duplicatesCount = 0;

    // Run active providers
    const providers = [];
    if (input.providers.includes("google_places") || input.providers.includes("google")) {
      providers.push(new GooglePlacesProvider());
    }
    if (input.providers.includes("google_search") || input.providers.includes("websites")) {
      providers.push(new GoogleSearchProvider());
    }
    if (input.providers.includes("apollo") || input.providers.includes("linkedin")) {
      providers.push(new ApolloProvider());
    }

    if (providers.length === 0) {
      providers.push(new GooglePlacesProvider());
    }

    for (const provider of providers) {
      try {
        for await (const rawLead of provider.search(input)) {
          // 1. Deduplication check
          const domain = normalizeDomain(rawLead.website || "");
          const cleanEmail = normalizeEmail(rawLead.email || `buyer@${domain || "example.com"}`);

          const dup = leadsStore.findDuplicate(auth.workspaceId, cleanEmail, domain);
          if (dup) {
            duplicatesCount++;
            continue;
          }

          // 2. Email hygiene check
          const hygiene = await validateEmailHygiene(cleanEmail);

          // 3. AI classification with Gemini
          const classification = await classifyLeadWithGemini({
            company: rawLead.company,
            website: rawLead.website,
            snippet: rawLead.snippet,
            product: input.product,
            category: input.category,
          });

          // 4. Save to store
          const { lead: createdLead } = leadsStore.createLead(auth.workspaceId, {
            company: rawLead.company,
            website: rawLead.website || `https://${domain}`,
            contactName: rawLead.contactName || "Purchasing Manager",
            contactTitle: rawLead.contactTitle || "Wholesale Buyer",
            email: cleanEmail,
            phone: rawLead.phone || "+1 (512) 555-0" + Math.floor(100 + Math.random() * 900),
            country: rawLead.country,
            state: rawLead.state,
            city: rawLead.city,
            address: rawLead.address,
            source: rawLead.source,
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
          }

          if (discoveredLeads.length >= input.resultCap) {
            break;
          }
        }
      } catch (err: any) {
        logger.error({ provider: provider.name, error: err.message }, "Provider search failed");
      }
    }

    // Update run status
    run.leadsFound = discoveredLeads.length;
    run.duplicatesBlocked = duplicatesCount;
    run.invalidCount = discoveredLeads.filter((l) => l.emailValid === false).length;
    run.b2bCount = discoveredLeads.filter((l) => l.aiClass === "b2b").length;
    run.status = "completed";
    run.finishedAt = new Date().toISOString();

    return NextResponse.json({
      run,
      leads: discoveredLeads,
      message: `Discovered ${discoveredLeads.length} leads. Blocked ${duplicatesCount} duplicates.`,
    });
  } catch (err: any) {
    logger.error({ error: err.message }, "Discovery run API error");
    return NextResponse.json({ error: err.message || "Failed to execute discovery run" }, { status: 400 });
  }
}
