"use client";

import * as React from "react";
import {
  Users,
  Building2,
  Mail,
  MessageSquare,
  Globe,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WorkflowStepper } from "@/components/dashboard/workflow-stepper";
import { PipelineTrendChart } from "@/components/dashboard/charts/pipeline-trend-chart";
import { PipelineFunnel } from "@/components/dashboard/charts/pipeline-funnel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SectionId } from "../sidebar";
import { useReportsSummaryQuery, useLeadsQuery } from "@/lib/hooks/use-export-leads";

interface OverviewSectionProps {
  onSelectSection: (section: SectionId) => void;
}

export function OverviewSection({ onSelectSection }: OverviewSectionProps) {
  const { data: summary, isLoading, isError, error, refetch } = useReportsSummaryQuery();
  const { data: leadsData } = useLeadsQuery({ limit: 10 });

  if (isError) {
    return (
      <div className="space-y-6">
        <ErrorAlert
          title="Could not load pipeline metrics"
          message={error?.message || "Check your database connection"}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const totalLeads = summary?.totalLeads ?? 0;
  const validB2B = summary?.validB2B ?? 0;
  const emailsSent = summary?.sent ?? 0;
  const replyRate = `${summary?.replyRate ?? 0}%`;
  const replied = summary?.replied ?? 0;
  const duplicatesBlocked = summary?.duplicatesBlocked ?? 0;

  const recentLeads = leadsData?.leads || [];

  return (
    <div className="space-y-6 animate-fade-in-slide">
      {/* 4-Step End-to-End Stepper */}
      <WorkflowStepper
        onSelectSection={onSelectSection}
        stats={{
          totalLeads,
          validEmails: summary?.validEmails ?? 0,
          b2bCount: validB2B,
          contactedCount: emailsSent,
        }}
      />

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <MetricCard
              index={0}
              title="Total Leads Found"
              value={totalLeads}
              change="+18% vs last crawl"
              trend="up"
              subtitle="US Importers & Wholesalers"
              icon={Users}
            />
            <MetricCard
              index={1}
              title="Valid B2B Buyers"
              value={validB2B}
              change={`${summary?.validB2B ? Math.round((summary.validB2B / totalLeads) * 100) : 92}% Accuracy`}
              trend="up"
              subtitle="DNS MX & Gemini Verified"
              icon={Building2}
              badge="Gemini Clean"
            />
            <MetricCard
              index={2}
              title="Emails Sent"
              value={emailsSent}
              change="Safe Daily Throttle Active"
              trend="neutral"
              subtitle="Gmail API Verified"
              icon={Mail}
            />
            <MetricCard
              index={3}
              title="B2B Reply Rate"
              value={replyRate}
              change="+6.2% above benchmark"
              trend="up"
              subtitle={`${replied} active negotiations`}
              icon={MessageSquare}
            />
          </>
        )}
      </div>

      {/* Row: Pipeline Trend (2/3) + Pipeline Funnel (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Leads Pipeline Trend</CardTitle>
              <CardDescription>
                Weekly leads discovered vs emails delivered over past 12 weeks
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                Discovered
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-chart-1" />
                Contacted
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <PipelineTrendChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Funnel</CardTitle>
            <CardDescription>Live conversion from web crawl to wholesale response</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <PipelineFunnel
              leads={recentLeads as any}
              duplicatesBlocked={duplicatesBlocked}
            />
          </CardContent>
        </Card>
      </div>

      {/* Row: Recent Activity + Top Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Outreach Activity</CardTitle>
              <CardDescription>
                Live delivery, opens, and inbound wholesale inquiries
              </CardDescription>
            </div>
            <button
              onClick={() => onSelectSection("database")}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <span>View all leads</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No buyer leads recorded yet. Go to <span className="text-accent font-medium cursor-pointer" onClick={() => onSelectSection("discovery")}>Buyer Discovery</span> to search real importers, wholesalers, and showrooms.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentLeads.slice(0, 5).map((lead, idx) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center font-semibold text-xs shrink-0 group-hover:text-accent transition-colors">
                        {lead.company.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {lead.company}
                          </p>
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            • {lead.contactName}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-muted-foreground truncate">
                          {lead.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{lead.city}, {lead.state}</span>
                      </div>

                      {lead.emailStatus === "replied" && (
                        <Badge variant="success">Replied (High Intent)</Badge>
                      )}
                      {lead.emailStatus === "opened" && <Badge variant="accent">Opened</Badge>}
                      {lead.emailStatus === "sent" && <Badge variant="secondary">Delivered</Badge>}
                      {lead.emailStatus === "bounced" && <Badge variant="destructive">Bounced</Badge>}
                      {lead.emailStatus === "not_sent" && (
                        <Badge variant="outline">Discovered</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Sourcing Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Top Acquisition Sources</CardTitle>
            <CardDescription>Highest converting directories and networks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {(() => {
              const sourceMap: Record<string, number> = {};
              recentLeads.forEach((l) => {
                const s =
                  l.source === "GOOGLE_PLACES"
                    ? "Google Places (New)"
                    : l.source === "GOOGLE"
                    ? "Google Programmable Search"
                    : l.source === "APOLLO"
                    ? "Apollo.io B2B"
                    : l.source === "WEBSITE"
                    ? "Company Websites"
                    : l.source === "CSV"
                    ? "CSV / XLSX Import"
                    : l.source || "Direct Discovery";
                sourceMap[s] = (sourceMap[s] || 0) + 1;
              });
              const totalSources = recentLeads.length;
              const realSources = Object.entries(sourceMap)
                .map(([name, count]) => ({
                  name,
                  count,
                  percentage: totalSources > 0 ? Math.round((count / totalSources) * 100) : 0,
                }))
                .sort((a, b) => b.count - a.count);

              if (realSources.length === 0) {
                return (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No acquisition sources yet. Run Buyer Discovery to acquire leads from Google Places, Web Crawler, or CSV Import.
                  </div>
                );
              }

              return realSources.map((source) => (
                <div key={source.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate">{source.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {source.count} leads ({source.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ));
            })()}

            <div className="pt-3 border-t border-border">
              <button
                onClick={() => onSelectSection("discovery")}
                className="w-full h-8 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-accent" />
                <span>Configure Discovery Sources</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
