import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { leadsStore } from "@/lib/leads-store";
import { classifyLeadWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const leadIds: string[] | undefined = body.leadIds;
    const threshold: number = body.threshold || 0.75;

    const { leads } = leadsStore.listLeads(auth.workspaceId, { limit: 500 });
    const targetLeads = leadIds && leadIds.length > 0
      ? leads.filter((l) => leadIds.includes(l.id))
      : leads.filter((l) => l.aiClass === null);

    let b2bCount = 0;
    let consumerCount = 0;

    for (const lead of targetLeads) {
      const res = await classifyLeadWithGemini({
        company: lead.company,
        website: lead.website,
      });

      const assignedClass = res.classification === "unknown" ? null : res.classification;
      leadsStore.updateLead(lead.id, auth.workspaceId, {
        aiClass: assignedClass,
        aiConfidence: res.confidence,
        aiReasoning: res.reasoning,
        buyerType: res.buyerType.toUpperCase() as any,
      });

      if (assignedClass === "b2b") b2bCount++;
      else if (assignedClass === "consumer") consumerCount++;
    }

    return NextResponse.json({
      success: true,
      evaluatedCount: targetLeads.length,
      b2bCount,
      consumerCount,
      message: `Gemini classified ${targetLeads.length} leads: ${b2bCount} B2B buyers qualified, ${consumerCount} consumers filtered.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
