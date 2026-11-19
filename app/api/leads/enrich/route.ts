import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { leadsStore } from "@/lib/leads-store";
import { enrichCompanyWebsite } from "@/lib/providers/crawler";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const { leadIds } = body as { leadIds: string[] };

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: "No lead IDs provided for enrichment" }, { status: 400 });
    }

    let enrichedCount = 0;
    let manualReviewCount = 0;
    const enrichedResults: any[] = [];

    for (const id of leadIds) {
      const lead = leadsStore.getLead(id, auth.workspaceId);
      if (!lead || !lead.website) continue;

      try {
        const result = await enrichCompanyWebsite(lead.website);

        const updates: any = {};
        if (result.bestEmail && (!lead.email || lead.email.includes("example.com") || lead.email.includes("sim_"))) {
          updates.email = result.bestEmail;
          updates.emailLower = result.bestEmail.toLowerCase();
        }
        if (result.bestPhone && !lead.phone) {
          updates.phone = result.bestPhone;
        }
        if (result.contactName && (!lead.contactName || lead.contactName === "Purchasing Team")) {
          updates.contactName = result.contactName;
          if (result.contactTitle) updates.contactTitle = result.contactTitle;
        }

        if (result.status === "needs_manual_review") {
          manualReviewCount++;
          updates.emailValidationReason = "Website blocks crawler / requires JS (needs manual review)";
        } else if (result.status === "enriched") {
          enrichedCount++;
          updates.sourceRef = result.sourceUrl;
        }

        if (Object.keys(updates).length > 0) {
          leadsStore.updateLead(id, auth.workspaceId, updates);
        }

        enrichedResults.push({
          leadId: id,
          company: lead.company,
          status: result.status,
          foundEmails: result.emails.length,
          bestEmail: result.bestEmail,
          socialLinks: result.socialLinks,
        });
      } catch (err: any) {
        logger.error({ leadId: id, error: err.message }, "Error enriching individual lead");
      }
    }

    return NextResponse.json({
      success: true,
      enrichedCount,
      manualReviewCount,
      message: `Enriched ${enrichedCount} leads. Flagged ${manualReviewCount} for manual review.`,
      results: enrichedResults,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Enrichment request failed" }, { status: 500 });
  }
}
