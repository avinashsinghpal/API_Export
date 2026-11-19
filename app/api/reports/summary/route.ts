import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { leadsStore } from "@/lib/leads-store";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { leads } = leadsStore.listLeads(auth.workspaceId, { limit: 5000 });

    const totalLeads = leads.length;
    const validEmails = leads.filter((l) => l.emailValid === true).length;
    const invalidEmails = leads.filter((l) => l.emailValid === false).length;
    const validB2B = leads.filter((l) => l.emailValid === true && l.aiClass === "b2b").length;
    const consumerCount = leads.filter((l) => l.aiClass === "consumer").length;
    const sent = leads.filter((l) => l.emailStatus !== "not_sent").length;
    const opened = leads.filter((l) => l.emailStatus === "opened" || l.emailStatus === "replied").length;
    const replied = leads.filter((l) => l.emailStatus === "replied").length;
    const bounced = leads.filter((l) => l.emailStatus === "bounced").length;
    const delivered = Math.max(0, sent - bounced);

    const replyRate = sent > 0 ? (replied / sent) * 100 : 0;
    const openRate = sent > 0 ? (opened / sent) * 100 : 0;
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;

    return NextResponse.json({
      totalLeads,
      validEmails,
      invalidEmails,
      validB2B,
      consumerCount,
      sent,
      delivered,
      opened,
      replied,
      bounced,
      replyRate: Number(replyRate.toFixed(1)),
      openRate: Number(openRate.toFixed(1)),
      bounceRate: Number(bounceRate.toFixed(1)),
      duplicatesBlocked: leadsStore.getDuplicatesBlockedCount(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
