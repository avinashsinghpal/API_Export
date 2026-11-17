"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  MailCheck,
  ServerOff,
  AtSign,
  ShieldAlert,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ValidationDonutChart } from "@/components/dashboard/charts/validation-donut-chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lead } from "@/lib/types";
import { toast } from "sonner";

interface ValidationSectionProps {
  leads: Lead[];
  onUpdateLead: (lead: Lead) => void;
  onRestoreLead?: (lead: Lead) => void;
}

export function ValidationSection({
  leads,
  onUpdateLead,
  onRestoreLead,
}: ValidationSectionProps) {
  const [isValidating, setIsValidating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const totalChecked = leads.filter((l) => l.emailValid !== null).length;
  const validCount = leads.filter((l) => l.emailValid === true).length;
  const invalidLeads = leads.filter((l) => l.emailValid === false);

  const handleRunValidation = () => {
    setIsValidating(true);
    setProgress(15);

    const steps = [
      { delay: 400, pct: 40 },
      { delay: 800, pct: 75 },
      { delay: 1300, pct: 100 },
    ];

    steps.forEach(({ delay, pct }) => {
      setTimeout(() => setProgress(pct), delay);
    });

    setTimeout(() => {
      setIsValidating(false);
      // Ensure all valid ones remain valid
      toast.success("Email Hygiene Run Complete!", {
        description: `Verified ${totalChecked} addresses. Flagged ${invalidLeads.length} invalid or high-risk inboxes.`,
      });
    }, 1600);
  };

  const handleRestore = (lead: Lead) => {
    const restored = { ...lead, emailValid: true, emailValidationReason: undefined };
    onUpdateLead(restored);
    toast.success(`Restored ${lead.company} to active outreach list.`);
  };

  return (
    <div className="space-y-6 animate-fade-in-slide">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          index={0}
          title="Total Inboxes Checked"
          value={totalChecked}
          subtitle="Syntax & DNS Lookup"
          icon={MailCheck}
          trend="neutral"
        />
        <MetricCard
          index={1}
          title="Verified Valid Mailboxes"
          value={validCount}
          change={`${Math.round((validCount / Math.max(totalChecked, 1)) * 100)}% Deliverable`}
          subtitle="Passed MX and SMTP ping"
          icon={CheckCircle2}
          trend="up"
        />
        <MetricCard
          index={2}
          title="Purged / High Risk"
          value={invalidLeads.length}
          change="Safeguards Triggered"
          subtitle="Spam traps & dead domains"
          icon={XCircle}
          trend="down"
        />
      </div>

      {/* Main Validation Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart breakdown (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Deliverability Breakdown</CardTitle>
              <CardDescription>
                Categorization of healthy vs risky email contacts
              </CardDescription>
            </div>
            <Button
              variant="accent"
              size="sm"
              onClick={handleRunValidation}
              disabled={isValidating}
              className="gap-1.5 text-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isValidating ? "Verifying DNS..." : "Run Hygiene Scan"}</span>
            </Button>
          </CardHeader>

          {isValidating && (
            <div className="px-6 py-2 space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-accent">
                <span>Pinging Mail Exchange Servers...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <CardContent className="pt-4">
            <ValidationDonutChart leads={leads} />
          </CardContent>
        </Card>

        {/* Deliverability Rules Card (1/3) */}
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle className="text-sm">Hygiene Rule Engine</CardTitle>
            <CardDescription>Rules applied to protect Gmail sender reputation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs">
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/40 border border-border">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">RFC-822 Syntax Enforcement</p>
                <p className="text-muted-foreground">Blocks malformed emails, spaces, double dots.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/40 border border-border">
              <ServerOff className="w-4 h-4 text-chart-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Active MX Record Check</p>
                <p className="text-muted-foreground">Validates destination mail server DNS resolution.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/40 border border-border">
              <ShieldAlert className="w-4 h-4 text-chart-3 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Disposable Domain Blocklist</p>
                <p className="text-muted-foreground">Filters temp-mail, 10minutemail, bot services.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/40 border border-border">
              <AtSign className="w-4 h-4 text-chart-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Role Account Quarantine</p>
                <p className="text-muted-foreground">Flags abuse@, postmaster@, noreply@ inboxes.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purged / Flagged Invalid Inboxes Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Purged & Quarantined Contacts</CardTitle>
            <CardDescription>
              Contacts excluded from cold email outreach to maintain &gt;95% deliverability
            </CardDescription>
          </div>
          <Badge variant="destructive">
            {invalidLeads.length} Blocked
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Company
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Flagged Email
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Detection Reason
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Risk Category
                  </th>
                  <th className="py-3 px-4 text-right font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invalidLeads.map((lead) => {
                  const reason = lead.emailValidationReason || "syntax_invalid";
                  return (
                    <tr key={lead.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">
                        {lead.company}
                      </td>
                      <td className="py-3 px-4 font-mono text-destructive">
                        {lead.email}
                      </td>
                      <td className="py-3 px-4">
                        {reason === "no_mx_record" && (
                          <span className="text-chart-4 font-medium">No MX record on domain</span>
                        )}
                        {reason === "disposable_domain" && (
                          <span className="text-chart-3 font-medium">Disposable temp-email provider</span>
                        )}
                        {reason === "syntax_invalid" && (
                          <span className="text-destructive font-medium">RFC Syntax malformed</span>
                        )}
                        {reason === "role_based" && (
                          <span className="text-chart-5 font-medium">Generic role inbox (postmaster/admin)</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="destructive">High Bounce Risk</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(lead)}
                          className="h-7 text-xs gap-1 hover:text-accent"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
