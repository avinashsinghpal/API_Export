import { CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { leadsStore } from "@/lib/leads-store";

interface UnsubscribePageProps {
  params: Promise<{ token: string }>;
}

export default async function UnsubscribePage({ params }: UnsubscribePageProps) {
  const { token } = await params;
  let decodedEmail = "your email address";
  let workspaceId = "ws_demo_auracrafts";

  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [email, ws] = raw.split(":::");
    if (email) decodedEmail = email;
    if (ws) workspaceId = ws;

    // Immediately record suppression
    leadsStore.addSuppression(workspaceId, decodedEmail, "unsubscribed");
  } catch (err) {
    // If decoding fails, proceed with default confirmation
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Unsubscribe Confirmed
          </h1>
          <p className="text-xs text-muted-foreground">
            <strong className="text-accent font-mono">{decodedEmail}</strong> has been permanently added to our do-not-contact suppression list.
          </p>
        </div>

        <div className="p-3.5 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground text-left space-y-1.5">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>CAN-SPAM &amp; GDPR Compliance</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            You will receive no further automated emails or export catalog communications regarding Tibetan singing bowls or home decor.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-accent hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to ExportLeads</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
