import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { leadsStore } from "@/lib/leads-store";
import { classifyLeadWithGemini } from "@/lib/gemini";
import { normalizeDomain } from "@/lib/normalizer";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const leadIds: string[] | undefined = body.leadIds;
    const threshold: number = body.threshold ?? 0.75;

    const { leads } = leadsStore.listLeads(auth.workspaceId, { limit: 500 });
    const targetLeads = leadIds && leadIds.length > 0
      ? leads.filter((l) => leadIds.includes(l.id))
      : leads.filter((l) => l.aiClass === null);

    let b2bCount = 0;
    let consumerCount = 0;
    let needsReviewCount = 0;

    // Process in batches of 4 with a 250ms throttle
    for (let i = 0; i < targetLeads.length; i++) {
      const lead = targetLeads[i];
      const domain = normalizeDomain(lead.website || "");

      const res = await classifyLeadWithGemini({
        company: lead.company,
        website: lead.website,
        domain,
        product: "Singing Bowls",
        category: "Home Decor",
      });

      // Confidence threshold check
      let assignedClass: "b2b" | "consumer" | null = null;
      let finalReasoning = res.reasoning;

      if (res.confidence < threshold || res.classification === "unknown") {
        assignedClass = null; // Stored as needs review
        needsReviewCount++;
        finalReasoning = `Confidence ${Math.round(res.confidence * 100)}% is below ${Math.round(threshold * 100)}% threshold — held for manual exporter review.`;
      } else if (res.classification === "b2b") {
        assignedClass = "b2b";
        b2bCount++;
      } else if (res.classification === "consumer") {
        assignedClass = "consumer";
        consumerCount++;
      }

      leadsStore.updateLead(lead.id, auth.workspaceId, {
        aiClass: assignedClass,
        aiConfidence: res.confidence,
        aiReasoning: finalReasoning,
        buyerType: res.buyerType.toUpperCase() as any,
      });

      if ((i + 1) % 4 === 0 && i < targetLeads.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    return NextResponse.json({
      success: true,
      evaluatedCount: targetLeads.length,
      b2bCount,
      consumerCount,
      needsReviewCount,
      message: `Gemini classified ${targetLeads.length} leads: ${b2bCount} B2B qualified, ${consumerCount} consumers filtered, ${needsReviewCount} flagged for review.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
