"use client";

import * as React from "react";
import {
  Mail,
  Send,
  FileText,
  Paperclip,
  Shield,
  Trash2,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  useLeadsQuery,
  useSettingsQuery,
  useCreateCampaignMutation,
} from "@/lib/hooks/use-export-leads";
import { calculateSpamRisk } from "@/lib/email-helpers";
import { toast } from "sonner";

export function OutreachSection() {
  const { data: leadsData } = useLeadsQuery({ limit: 200 });
  const { data: settings } = useSettingsQuery();
  const createCampaignMutation = useCreateCampaignMutation();

  const leads = leadsData?.leads || [];

  // Composer state
  const [subject, setSubject] = React.useState(
    "Artisanal Singing Bowls & Handcrafted Sound Sets for {{company_name}} [Direct Exporter]"
  );

  const [body, setBody] = React.useState(
    `Dear {{contact_name}},\n\nI came across {{company_name}} while reviewing top-tier home decor and wellness showrooms in {{state}}, {{country}}.\n\nWe are direct manufacturers and exporters of authentic hand-hammered 7-metal Tibetan Singing Bowls, meditation bells, and bronze acoustic decor based in Moradabad & Jaipur, India.\n\nKey highlights for US wholesalers:\n• 100% hand-tuned frequencies (Chakra sets from 4" to 14")\n• Direct FOB / CIF pricing (saving 35-45% compared to US domestic distributors)\n• Custom laser engraving and retail gift packaging available\n• Low MOQ for trial orders with door-to-door DHL/Air Cargo delivery\n\nI have attached our 2026 Wholesale Product Presentation & Pricing Catalog (PDF) for your review.\n\nCould we arrange a brief 5-minute call or reply with your preferred bowl sizes for complimentary sample dispatch?\n\nWarm regards,\n\nAvinash Singh\nHead of International Trade\nAura Crafts Exports, India\nWhatsApp / Direct: +91 98110 23456\nWeb: https://auracraftsexports.com`
  );

  const [attachment, setAttachment] = React.useState<{ name: string; size: string } | null>({
    name: "Singing-Bowls-Wholesale-Catalog-2026.pdf",
    size: "2.4 MB",
  });

  // Safeguards state
  const [safeguards, setSafeguards] = React.useState({
    dailyCap: 40,
    delayMin: 60,
    delayMax: 120,
    warmUpMode: true,
    skipAlreadyContacted: true,
    autoStopBounce: true,
  });

  // Eligible recipients
  const eligibleRecipients = React.useMemo(() => {
    return leads.filter((l) => {
      if (l.emailValid !== true) return false;
      if (l.aiClass !== "b2b") return false;
      if (safeguards.skipAlreadyContacted && l.emailStatus !== "not_sent") return false;
      return true;
    });
  }, [leads, safeguards.skipAlreadyContacted]);

  const sampleLead = eligibleRecipients[0] || leads[0];

  const previewSubject = React.useMemo(() => {
    if (!sampleLead) return subject;
    return subject
      .replace(/{{company_name}}/g, sampleLead.company)
      .replace(/{{contact_name}}/g, sampleLead.contactName || "Purchasing Team")
      .replace(/{{product}}/g, "Singing Bowls")
      .replace(/{{country}}/g, sampleLead.country)
      .replace(/{{state}}/g, sampleLead.state || "US");
  }, [subject, sampleLead]);

  const previewBody = React.useMemo(() => {
    if (!sampleLead) return body;
    return body
      .replace(/{{company_name}}/g, sampleLead.company)
      .replace(/{{contact_name}}/g, sampleLead.contactName || "Purchasing Team")
      .replace(/{{product}}/g, "Singing Bowls")
      .replace(/{{country}}/g, sampleLead.country)
      .replace(/{{state}}/g, sampleLead.state || "US");
  }, [body, sampleLead]);

  // Spam-risk evaluation
  const spamEval = React.useMemo(() => {
    return calculateSpamRisk({
      subject,
      body,
      hasAttachment: !!attachment,
      attachmentSizeMB: 2.4,
      hasUnsubscribe: true,
    });
  }, [subject, body, attachment]);

  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const insertToken = (token: string) => {
    setBody((prev) => `${prev} ${token}`);
  };

  const handleStartCampaign = async () => {
    setConfirmDialogOpen(false);
    setIsSending(true);

    try {
      const res = await createCampaignMutation.mutateAsync({
        name: `US Singing Bowls Wholesale - Q4 Campaign`,
        product: "Singing Bowls",
        country: "United States",
        subject,
        bodyTemplate: body,
        sendConfig: safeguards,
      });

      setIsSending(false);
      toast.success("Outreach Campaign Dispatched!", {
        description: res.message,
      });
    } catch (err: any) {
      setIsSending(false);
      toast.error(err.message || "Failed to start campaign");
    }
  };

  const handleSendTestEmail = async () => {
    try {
      const res = await fetch("/api/campaigns/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: settings?.senderEmail || "exportleads.demo@gmail.com",
          subject,
          bodyTemplate: body,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed test send");
      toast.success("Test Email Dispatched!", {
        description: json.message,
      });
    } catch (err: any) {
      toast.error(err.message || "Test send failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-slide">
      {/* Coming Soon Notice */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-chart-1/30 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-chart-1/15 text-chart-1 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground flex items-center gap-2">
              <span>Gmail Outreach Engine &amp; Reply Tracking</span>
              <span className="px-2 py-0.5 rounded-full bg-chart-1/20 text-chart-1 text-[10px] font-mono font-bold uppercase">
                Coming Soon
              </span>
            </p>
            <p className="text-muted-foreground">
              This interactive preview demonstrates the RFC-2822 MIME composer, merge tokens, and real-time spam scoring. Live email dispatching is intentionally deferred — no emails are sent in this local discovery edition.
            </p>
          </div>
        </div>
      </div>

      {/* Gmail Connection & Throttle Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">
                  Sender: {settings?.senderEmail || "exportleads.demo@gmail.com"}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent/20 text-accent font-semibold">
                  OAuth Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Google Workspace SMTP relay with DKIM, SPF &amp; DMARC compliance headers
              </p>
            </div>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="text-xs text-muted-foreground">
              Daily Limit: <strong className="text-foreground font-mono">18 / {settings?.dailyCap || 40}</strong>
            </div>
            <div className="w-40 sm:w-48 h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: "45%" }} />
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold text-muted-foreground">Qualified Recipients</span>
            <div className="text-xl font-bold font-mono text-accent">
              {eligibleRecipients.length} Buyers
            </div>
            <p className="text-[11px] text-muted-foreground">Valid MX + Verified B2B + Uncontacted</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* Main Composer & Live Merge Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Personalized Email Composer</CardTitle>
              <span className="text-xs text-muted-foreground">Dynamic Token Merge</span>
            </div>
            <CardDescription>
              Write outreach copy. Tokens will be automatically substituted per recipient.
            </CardDescription>
          </CardHeader>

          {/* Merge Tokens Chips */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground block">
              Click to insert personalization token:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "{{company_name}}",
                "{{contact_name}}",
                "{{product}}",
                "{{country}}",
                "{{state}}",
              ].map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => insertToken(token)}
                  className="px-2.5 py-1 rounded bg-secondary hover:bg-accent/15 hover:text-accent font-mono text-[11px] text-muted-foreground border border-border transition-colors cursor-pointer"
                >
                  + {token}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Subject Line</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Artisanal Singing Bowls for {{company_name}}"
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Email Body Template (RFC 2822 Alternative)
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={11}
              className="font-sans text-xs leading-relaxed"
            />
          </div>

          {/* PDF Attachment Dropzone */}
          <div className="space-y-2 pt-1 border-t border-border">
            <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Attached Product Presentation / Catalog</span>
              <span className="text-[11px] text-accent">PDF Deliverable</span>
            </label>

            {attachment ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/60 border border-accent/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-medium text-foreground">{attachment.name}</p>
                    <p className="font-mono text-muted-foreground">{attachment.size}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAttachment(null)}
                  className="h-7 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() =>
                  setAttachment({
                    name: "Singing-Bowls-Wholesale-Catalog-2026.pdf",
                    size: "2.4 MB",
                  })
                }
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
              >
                <Paperclip className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs font-medium text-foreground">Click to attach product catalog PDF</p>
              </div>
            )}
          </div>
        </Card>

        {/* Live Preview Column */}
        <div className="space-y-4">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="p-0 pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Live Recipient Preview</CardTitle>
                <span className="text-[11px] font-mono text-accent">
                  Simulating: {sampleLead?.company || "Sample Buyer"}
                </span>
              </div>
              <CardDescription>
                How this email will render in the buyer&apos;s Gmail / Outlook client
              </CardDescription>
            </CardHeader>

            <div className="flex-1 py-3 space-y-3 text-xs overflow-y-auto max-h-[460px]">
              <div className="p-3 rounded-lg bg-secondary/40 border border-border space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-mono text-foreground font-medium">
                    {sampleLead?.contactName || "Marcus Vance"} &lt;{sampleLead?.email || "marcus@wholesale.com"}&gt;
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From:</span>
                  <span className="text-foreground">
                    {settings?.senderName || "Avinash Singh"} &lt;{settings?.senderEmail || "exportleads.demo@gmail.com"}&gt;
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-semibold text-accent truncate max-w-sm">{previewSubject}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-card border border-border whitespace-pre-line text-foreground/90 font-sans leading-relaxed text-xs">
                {previewBody}
              </div>

              {attachment && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-medium text-foreground">{attachment.name}</span>
                  <span className="font-mono text-muted-foreground">({attachment.size})</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Verify formatting before mass sending</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTestEmail}
                className="text-xs h-8"
              >
                Send Test Email to Me
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Deliverability Safeguards & Spam Risk Card */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              Deliverability Safeguards &amp; Anti-Spam Controls
            </CardTitle>
            <CardDescription>
              Engineered to protect domain reputation and prevent spam blocks
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Calculated Spam Risk:</span>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary border border-border">
              <span
                className={`text-xs font-bold font-mono ${
                  spamEval.level === "Low"
                    ? "text-accent"
                    : spamEval.level === "Medium"
                    ? "text-warning"
                    : "text-destructive"
                }`}
              >
                {spamEval.level} ({spamEval.score}/100)
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground">Daily Send Cap</span>
              <span className="font-mono font-bold text-accent">{safeguards.dailyCap} emails/day</span>
            </div>
            <Input
              type="number"
              value={safeguards.dailyCap}
              onChange={(e) => setSafeguards({ ...safeguards, dailyCap: parseInt(e.target.value) || 20 })}
              max={50}
              min={5}
              className="h-8 text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground">Maximum recommended for export cold emails is 40.</p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground">Delay Between Emails</span>
              <span className="font-mono font-bold text-accent">{safeguards.delayMin}s - {safeguards.delayMax}s</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={safeguards.delayMin}
                onChange={(e) => setSafeguards({ ...safeguards, delayMin: parseInt(e.target.value) || 30 })}
                className="h-8 text-xs font-mono"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="number"
                value={safeguards.delayMax}
                onChange={(e) => setSafeguards({ ...safeguards, delayMax: parseInt(e.target.value) || 120 })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Jittered random intervals emulate human typing.</p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Gradual Warm-Up Mode</span>
              <Switch
                checked={safeguards.warmUpMode}
                onCheckedChange={(c) => setSafeguards({ ...safeguards, warmUpMode: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Skip Already Contacted</span>
              <Switch
                checked={safeguards.skipAlreadyContacted}
                onCheckedChange={(c) => setSafeguards({ ...safeguards, skipAlreadyContacted: c })}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Auto-Stop if Bounce &gt; 5%</span>
              <Switch
                checked={safeguards.autoStopBounce}
                onCheckedChange={(c) => setSafeguards({ ...safeguards, autoStopBounce: c })}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Info className="w-4 h-4 text-accent" />
            <span>
              Ready to send to <strong className="text-foreground">{Math.min(eligibleRecipients.length, safeguards.dailyCap)}</strong> qualified buyers today.
            </span>
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              toast.info("Outreach sending is reserved for a future release. No emails sent in this version.");
            }}
            className="w-full sm:w-auto min-w-[200px] gap-2 font-semibold border border-border"
          >
            <Send className="w-4 h-4 text-muted-foreground" />
            <span>Outreach Sending (Coming Soon)</span>
          </Button>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Cold Outreach via Gmail?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to queue{" "}
              <strong className="text-foreground">
                {Math.min(eligibleRecipients.length, safeguards.dailyCap)} personalized emails
              </strong>{" "}
              with <strong>Singing-Bowls-Wholesale-Catalog-2026.pdf</strong> attached.
              <br /><br />
              All deliverability throttles ({safeguards.delayMin}-{safeguards.delayMax}s delay, daily cap of {safeguards.dailyCap}) will be automatically applied.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Draft</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartCampaign}>
              Yes, Dispatch Emails
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
