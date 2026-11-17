"use client";

import * as React from "react";
import {
  Users,
  Building2,
  Mail,
  MessageSquare,
  Globe,
  ExternalLink,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WorkflowStepper } from "@/components/dashboard/workflow-stepper";
import { PipelineTrendChart } from "@/components/dashboard/charts/pipeline-trend-chart";
import { PipelineFunnel } from "@/components/dashboard/charts/pipeline-funnel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead, EmailLog } from "@/lib/types";
import { SectionId } from "../sidebar";
import { TOP_SOURCES_DATA } from "@/lib/mock-data";

interface OverviewSectionProps {
  leads: Lead[];
  emailLogs: EmailLog[];
  onSelectSection: (section: SectionId) => void;
  duplicatesBlocked: number;
}

export function OverviewSection({
  leads,
  emailLogs,
  onSelectSection,
  duplicatesBlocked,
}: OverviewSectionProps) {
  const totalLeads = leads.length;
  const validB2B = leads.filter((l) => l.emailValid === true && l.aiClass === "b2b").length;
  const emailsSent = leads.filter((l) => l.emailStatus !== "not_sent").length;
  const replies = leads.filter((l) => l.emailStatus === "replied").length;
  const replyRate = emailsSent > 0 ? ((replies / emailsSent) * 100).toFixed(1) + "%" : "0%";

  return (
    <div className="space-y-6 animate-fade-in-slide">
      {/* 4-Step End-to-End Stepper */}
      <WorkflowStepper
        onSelectSection={onSelectSection}
        stats={{
          totalLeads,
          validEmails: leads.filter((l) => l.emailValid === true).length,
          b2bCount: validB2B,
          contactedCount: emailsSent,
        }}
      />

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          index={0}
          title="Total Leads Found"
          value={totalLeads}
          change="+18% vs last run"
          trend="up"
          subtitle="US Importers & Retailers"
          icon={Users}
        />
        <MetricCard
          index={1}
          title="Valid B2B Buyers"
          value={validB2B}
          change="+94.2% accuracy"
          trend="up"
          subtitle="AI & MX Verified"
          icon={Building2}
          badge="Gemini Clean"
        />
        <MetricCard
          index={2}
          title="Emails Sent"
          value={emailsSent}
          change="32 queued for tomorrow"
          trend="neutral"
          subtitle="Gmail Safe Throttle"
          icon={Mail}
        />
        <MetricCard
          index={3}
          title="B2B Reply Rate"
          value={replyRate}
          change="+6.2% above benchmark"
          trend="up"
          subtitle={`${replies} active negotiations`}
          icon={MessageSquare}
        />
      </div>

      {/* Row: Pipeline Trend (2/3) + Pipeline Funnel (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Leads Pipeline Trend</CardTitle>
              <CardDescription>
                Weekly leads discovered vs emails delivered over the past 12 weeks
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
            <CardDescription>Conversion from web discovery to verified B2B response</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <PipelineFunnel leads={leads} duplicatesBlocked={duplicatesBlocked} />
          </CardContent>
        </Card>
      </div>

      {/* Row: Recent Activity + Top Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity List (2/3) */}
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
            <div className="divide-y divide-border">
              {emailLogs.slice(0, 5).map((log, idx) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                  style={{
                    animationDelay: `${idx * 60}ms`,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center font-semibold text-xs shrink-0 group-hover:text-accent transition-colors">
                      {log.company.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {log.company}
                        </p>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          • {log.contactName}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {log.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{log.timestamp}</span>
                    </div>

                    {log.status === "replied" && (
                      <Badge variant="success">Replied (High Intent)</Badge>
                    )}
                    {log.status === "opened" && <Badge variant="accent">Opened</Badge>}
                    {log.status === "sent" && <Badge variant="secondary">Delivered</Badge>}
                    {log.status === "bounced" && <Badge variant="destructive">Bounced</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Sourcing Channels (1/3) */}
        <Card>
          <CardHeader>
            <CardTitle>Top Acquisition Sources</CardTitle>
            <CardDescription>Highest converting directories and networks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {TOP_SOURCES_DATA.map((source) => (
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
            ))}

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
