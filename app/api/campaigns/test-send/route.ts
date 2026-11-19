import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { TestEmailSchema } from "@/lib/validations";
import { leadsStore } from "@/lib/leads-store";
import { buildRfc2822Message, sendGmailMessage } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = TestEmailSchema.parse(body);
    const settings = leadsStore.getSettings();

    const rawMime = await buildRfc2822Message({
      toEmail: input.recipientEmail,
      toName: "Exporter Reviewer",
      companyName: "Sample Retail Showroom LLC",
      product: "Singing Bowls",
      country: "United States",
      state: "Texas",
      subjectTemplate: input.subject,
      bodyTemplate: input.bodyTemplate,
      workspaceId: auth.workspaceId,
      senderName: settings.senderName,
      senderEmail: settings.senderEmail,
      senderAddress: settings.senderAddress,
    });

    const dispatchResult = await sendGmailMessage(rawMime);

    return NextResponse.json({
      success: true,
      messageId: dispatchResult.messageId,
      message: `Test email successfully sent to ${input.recipientEmail}!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send test email" }, { status: 400 });
  }
}
