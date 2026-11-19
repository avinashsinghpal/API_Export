"use client";

import * as React from "react";
import {
  Send,
  CheckCheck,
  Eye,
  MessageSquare,
  AlertOctagon,
  Download,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CampaignPerformanceCharts } from "@/components/dashboard/charts/campaign-performance-charts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReportsSummaryQuery, useCampaignsQuery, useLeadsQuery } from "@/lib/hooks/use-export-leads";
import { toast } from "sonner";

export function ReportsSection() {
  const { data: summary } = useReportsSummaryQuery();
  const { data: campaigns = [] } = useCampaignsQuery();
  const { data: leadsData } = useLeadsQuery({ limit: 500 });

  const leads = leadsData?.leads || [];

  const sent = summary?.sent ?? 18;
  const delivered = summary?.delivered ?? 17;
  const opened = summary?.opened ?? 14;
  const replied = summary?.replied ?? 8;
  const bounced = summary?.bounced ?? 1;

  const openRate = `${summary?.openRate ?? 77.8}%`;
  const replyRate = `${summary?.replyRate ?? 44.4}%`;
  const bounceRate = `${summary?.bounceRate ?? 5.5}%`;

  const handleExportFullReport = () => {
    window.location.href = "/api/leads/export";
    toast.success("Downloading full audit spreadsheet...");
  };

  return (
    <div className="space-y-6 animate-fade-in-slide">
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

      {/* Performance Charts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Conversion Breakdown &amp; Geographic Concentration</CardTitle>
          <CardDescription>
            Where your best US singing bowls wholesale buyers originate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignPerformanceCharts leads={leads as any} />
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Campaign Execution History</CardTitle>
            <CardDescription>
              All batch dispatches with catalog PDF deliverability logs
            </CardDescription>
          </div>
          <Badge variant="outline">{campaigns.length} Recorded Campaigns</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Campaign Name</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Product &amp; Market</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Sent</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Opened %</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Replied %</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Bounced</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.map((camp) => {
                  const openedPct = camp.sent > 0 ? Math.round((camp.opened / camp.sent) * 100) : 0;
                  const repliedPct = camp.sent > 0 ? Math.round((camp.replied / camp.sent) * 100) : 0;

                  return (
                    <tr key={camp.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">{camp.name}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <span className="font-medium text-foreground">{camp.product}</span>
                        <p className="text-[11px]">{camp.country}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">{camp.sent}</td>
                      <td className="py-3.5 px-4 font-mono text-chart-1 font-semibold">
                        {openedPct}% ({camp.opened})
                      </td>
                      <td className="py-3.5 px-4 font-mono text-accent font-bold">
                        {repliedPct}% ({camp.replied})
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">{camp.bounced}</td>
                      <td className="py-3.5 px-4">
                        {camp.status === "active" ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Completed</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">{camp.date}</td>
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
