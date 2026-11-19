import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { BulkLeadActionSchema } from "@/lib/validations";
import { leadsStore } from "@/lib/leads-store";
import { validateEmailHygiene } from "@/lib/dns";
import { classifyLeadWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const { leadIds, action } = BulkLeadActionSchema.parse(body);

    if (action === "delete") {
      const count = leadsStore.deleteLeads(leadIds, auth.workspaceId);
      return NextResponse.json({ success: true, count, message: `Deleted ${count} leads.` });
    }

    if (action === "validate") {
      let validatedCount = 0;
      for (const id of leadIds) {
        const lead = leadsStore.getLead(id, auth.workspaceId);
        if (lead) {
          const hygiene = await validateEmailHygiene(lead.email);
          leadsStore.updateLead(id, auth.workspaceId, {
            emailValid: hygiene.isValid,
            emailValidationReason: hygiene.reason,
          });
          validatedCount++;
        }
      }
      return NextResponse.json({ success: true, count: validatedCount, message: `Validated ${validatedCount} emails.` });
    }

    if (action === "classify") {
      let classifiedCount = 0;
      for (const id of leadIds) {
        const lead = leadsStore.getLead(id, auth.workspaceId);
        if (lead) {
          const res = await classifyLeadWithGemini({
            company: lead.company,
            website: lead.website,
          });
          leadsStore.updateLead(id, auth.workspaceId, {
            aiClass: res.classification === "unknown" ? null : res.classification,
            aiConfidence: res.confidence,
            aiReasoning: res.reasoning,
            buyerType: res.buyerType.toUpperCase() as any,
          });
          classifiedCount++;
        }
      }
      return NextResponse.json({ success: true, count: classifiedCount, message: `Classified ${classifiedCount} buyer profiles with Gemini.` });
    }

    return NextResponse.json({ error: "Invalid bulk action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
