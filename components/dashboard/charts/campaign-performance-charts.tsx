"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Lead } from "@/lib/types";

interface CampaignPerformanceChartsProps {
  leads: Lead[];
}

export function CampaignPerformanceCharts({ leads }: CampaignPerformanceChartsProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 250);
    return () => clearTimeout(timer);
  }, []);

  // Reply rate by channel/source
  const sourceStats = [
    { source: "Google", sent: 0, replied: 0 },
    { source: "LinkedIn", sent: 0, replied: 0 },
    { source: "Directories", sent: 0, replied: 0 },
    { source: "Websites", sent: 0, replied: 0 },
    { source: "Facebook", sent: 0, replied: 0 },
  ];

  leads.forEach((l) => {
    const key =
      l.source === "google"
        ? 0
        : l.source === "linkedin"
        ? 1
        : l.source === "directory"
        ? 2
        : l.source === "website"
        ? 3
        : 4;

    if (l.emailStatus !== "not_sent") {
      sourceStats[key].sent += 1;
      if (l.emailStatus === "replied") {
        sourceStats[key].replied += 1;
      }
    }
  });

  const replyRateData = sourceStats.map((s) => ({
    source: s.source,
    rate: s.sent > 0 ? Math.round((s.replied / s.sent) * 100) : 0,
    sent: s.sent,
    replied: s.replied,
  }));

  // Geographic distribution top states
  const stateCounts: Record<string, number> = {};
  leads.forEach((l) => {
    const st = l.state || "Other";
    stateCounts[st] = (stateCounts[st] || 0) + 1;
  });

  const topStatesData = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([state, count]) => ({ state, count }));

  if (!mounted) {
    return <div className="h-[240px] w-full animate-pulse rounded-lg bg-secondary/30" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Reply Rate by Source */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reply Conversion Rate by Source (%)
          </p>
          <span className="text-xs text-accent font-mono font-medium">Top: LinkedIn / Directories</span>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={replyRateData}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="source"
                stroke="none"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="none"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card p-2.5 shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-foreground">{label}</p>
                        <p className="text-accent font-mono font-bold">
                          Reply Rate: {d.rate}%
                        </p>
                        <p className="text-muted-foreground">
                          {d.replied} replied of {d.sent} sent
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="rate" name="Reply Rate (%)" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top US States for Singing Bowls / Decor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Top US Destination States (Leads Count)
          </p>
          <span className="text-xs text-chart-1 font-mono font-medium">Concentration: TX & CA</span>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topStatesData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 25, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="none"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="state"
                stroke="none"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card p-2.5 shadow-xl text-xs">
                        <p className="font-semibold text-foreground">{d.state}</p>
                        <p className="font-mono text-foreground font-bold mt-0.5">
                          {d.count} Qualified Importers & Showrooms
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" name="Qualified Leads" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
