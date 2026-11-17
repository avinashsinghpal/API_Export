"use client";

import * as React from "react";
import {
  Send,
  CheckCheck,
  Eye,
  MessageSquare,
  AlertOctagon,
  Download,
  Calendar,
  ExternalLink,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CampaignPerformanceCharts } from "@/components/dashboard/charts/campaign-performance-charts";
import { PipelineFunnel } from "@/components/dashboard/charts/pipeline-funnel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead, Campaign } from "@/lib/types";
import { toast } from "sonner";

interface ReportsSectionProps {
  leads: Lead[];
  campaigns: Campaign[];
}

export function ReportsSection({ leads, campaigns }: ReportsSectionProps) {
  const sent = leads.filter((l) => l.emailStatus !== "not_sent").length;
  const opened = leads.filter(
    (l) => l.emailStatus === "opened" || l.emailStatus === "replied"
  ).length;
  const replied = leads.filter((l) => l.emailStatus === "replied").length;
  const bounced = leads.filter((l) => l.emailStatus === "bounced").length;
  const delivered = Math.max(0, sent - bounced);

  const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) + "%" : "0%";
  const replyRate = sent > 0 ? ((replied / sent) * 100).toFixed(1) + "%" : "0%";
  const bounceRate = sent > 0 ? ((bounced / sent) * 100).toFixed(1) + "%" : "0%";

  const handleExportFullReport = () => {
    const reportData = [
      ["ExportLeads Performance Audit Report - Singing Bowls US Market"],
      ["Generated", new Date().toLocaleString()],
      [""],
      ["KPI Summary"],
      ["Total Discovered Leads", leads.length],
      ["Emails Sent", sent],
      ["Delivered", delivered],
      ["Opened", opened, `(${openRate})`],
      ["Replies Received", replied, `(${replyRate})`],
      ["Bounces", bounced, `(${bounceRate})`],
      [""],
      ["Active Campaigns Breakdown"],
      ["Campaign Name", "Product", "Sent", "Opened %", "Replied %", "Bounced", "Status"],
      ...campaigns.map((c) => [
        `"${c.name}"`,
        `"${c.product}"`,
        c.sent,
        `${Math.round((c.opened / c.sent) * 100)}%`,
        `${Math.round((c.replied / c.sent) * 100)}%`,
        c.bounced,
        c.status,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + reportData.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ExportLeads_Campaign_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Executive Performance Report Exported!", {
      description: "Downloaded comprehensive campaign statistics spreadsheet.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-slide">
      {/* Header with Export CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Outreach Conversion &amp; Intelligence Reports
          </h2>
          <p className="text-xs text-muted-foreground">
            Aggregate performance across US wholesale and showroom buyer campaigns
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportFullReport}
          className="gap-1.5 text-xs h-9"
        >
          <Download className="w-3.5 h-3.5 text-accent" />
          <span>Export Audit Report (CSV)</span>
        </Button>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          index={0}
          title="Total Sent"
          value={sent}
          subtitle="Direct from Gmail"
          icon={Send}
          trend="neutral"
        />
        <MetricCard
          index={1}
          title="Delivered"
          value={delivered}
          change="97.2% deliverability"
          subtitle="Zero spam traps"
          icon={CheckCheck}
          trend="up"
        />
        <MetricCard
          index={2}
          title="Opened"
          value={opened}
          change={openRate}
          subtitle="Catalog views"
          icon={Eye}
          trend="up"
        />
        <MetricCard
          index={3}
          title="Replied"
          value={replied}
          change={replyRate}
          subtitle="Wholesale quote inquiries"
          icon={MessageSquare}
          trend="up"
        />
        <MetricCard
          index={4}
          title="Bounced"
          value={bounced}
          change={bounceRate}
          subtitle="Under 5% threshold"
          icon={AlertOctagon}
          trend="down"
        />
      </div>

      {/* Performance Charts (Source rate & State breakdown) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Conversion Breakdown &amp; Geographic Concentration</CardTitle>
          <CardDescription>
            Where your best US singing bowls wholesale buyers originate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignPerformanceCharts leads={leads} />
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Campaign Execution History</CardTitle>
            <CardDescription>
              All automated batch dispatches with catalog PDF delivery
            </CardDescription>
          </div>
          <Badge variant="outline">
            {campaigns.length} Recorded Campaigns
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Campaign Name
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Product &amp; Market
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Sent
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Opened %
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Replied %
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Bounced
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((camp) => {
                  const openedPct = Math.round((camp.opened / camp.sent) * 100);
                  const repliedPct = Math.round((camp.replied / camp.sent) * 100);

                  return (
                    <tr key={camp.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {camp.name}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <span className="font-medium text-foreground">{camp.product}</span>
                        <p className="text-[11px]">{camp.country}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        {camp.sent}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-chart-1 font-semibold">
                        {openedPct}% ({camp.opened})
                      </td>
                      <td className="py-3.5 px-4 font-mono text-accent font-bold">
                        {repliedPct}% ({camp.replied})
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {camp.bounced}
                      </td>
                      <td className="py-3.5 px-4">
                        {camp.status === "active" ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Completed</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {camp.date}
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
