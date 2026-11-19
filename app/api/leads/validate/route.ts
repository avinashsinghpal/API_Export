import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { leadsStore } from "@/lib/leads-store";
import { validateEmailHygiene } from "@/lib/dns";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const leadIds: string[] | undefined = body.leadIds;

    const { leads } = leadsStore.listLeads(auth.workspaceId, { limit: 500 });
    const targetLeads = leadIds && leadIds.length > 0
      ? leads.filter((l) => leadIds.includes(l.id))
      : leads;

    let validCount = 0;
    let invalidCount = 0;

    for (const lead of targetLeads) {
      const result = await validateEmailHygiene(lead.email);
      leadsStore.updateLead(lead.id, auth.workspaceId, {
        emailValid: result.isValid,
        emailValidationReason: result.reason,
      });

      if (result.isValid) validCount++;
      else invalidCount++;
    }

    return NextResponse.json({
      success: true,
      totalChecked: targetLeads.length,
      validCount,
      invalidCount,
      message: `Checked ${targetLeads.length} mailboxes: ${validCount} valid, ${invalidCount} flagged.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
