import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { CreateCampaignSchema } from "@/lib/validations";
import { leadsStore } from "@/lib/leads-store";
import { buildRfc2822Message, sendGmailMessage } from "@/lib/gmail";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const campaigns = leadsStore.listCampaigns(auth.workspaceId);
    return NextResponse.json({ campaigns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = CreateCampaignSchema.parse(body);

    const settings = leadsStore.getSettings();
    const { leads } = leadsStore.listLeads(auth.workspaceId, { limit: 500 });

    // Filter recipients: valid email + B2B + uncontacted + not suppressed
    const eligibleLeads = leads.filter((l) => {
      if (input.leadIds && input.leadIds.length > 0) {
        return input.leadIds.includes(l.id);
      }
      if (l.emailValid !== true) return false;
      if (l.aiClass !== "b2b") return false;
      if (input.sendConfig.skipAlreadyContacted && l.emailStatus !== "not_sent") return false;
      if (leadsStore.isSuppressed(auth.workspaceId, l.email)) return false;
      return true;
    });

    const targetList = eligibleLeads.slice(0, input.sendConfig.dailyCap || 40);

    let sentCount = 0;
    for (const lead of targetList) {
      try {
        const rawMime = await buildRfc2822Message({
          toEmail: lead.email,
          toName: lead.contactName,
          companyName: lead.company,
          product: input.product,
          country: lead.country,
          state: lead.state,
          subjectTemplate: input.subject,
          bodyTemplate: input.bodyTemplate,
          workspaceId: auth.workspaceId,
          senderName: settings.senderName,
          senderEmail: settings.senderEmail,
          senderAddress: settings.senderAddress,
        });

        await sendGmailMessage(rawMime);

        leadsStore.updateLead(lead.id, auth.workspaceId, {
          emailStatus: "sent",
        });

        sentCount++;
      } catch (sendErr: any) {
        logger.error({ leadId: lead.id, error: sendErr.message }, "Failed to send email to lead");
      }
    }

    const campaign = leadsStore.createCampaign(auth.workspaceId, {
      name: input.name,
      product: input.product,
      country: input.country,
      subject: input.subject,
      bodyTemplate: input.bodyTemplate,
      sent: sentCount,
      delivered: sentCount,
      status: "active",
    });

    return NextResponse.json({
      success: true,
      campaign,
      sentCount,
      message: `Campaign started! Dispatched ${sentCount} emails via Gmail.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to start campaign" }, { status: 400 });
  }
}
