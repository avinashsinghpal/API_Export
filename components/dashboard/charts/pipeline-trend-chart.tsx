"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { usePipelineTimeseriesQuery } from "@/lib/hooks/use-export-leads";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-xl text-xs space-y-1.5">
        <p className="font-semibold text-foreground">{label} Pipeline Stats</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.stroke || entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-mono font-medium text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function PipelineTrendChart() {
  const [mounted, setMounted] = React.useState(false);
  const { data: timeseriesData } = usePipelineTimeseriesQuery();

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 250);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="h-[280px] w-full animate-pulse rounded-lg bg-secondary/30" />;
  }

  const chartData = timeseriesData && timeseriesData.length > 0
    ? timeseriesData
    : [
        { week: "W-3", discovered: 0, emailsSent: 0, replies: 0 },
        { week: "W-2", discovered: 0, emailsSent: 0, replies: 0 },
        { week: "W-1", discovered: 0, emailsSent: 0, replies: 0 },
        { week: "Current", discovered: 0, emailsSent: 0, replies: 0 },
      ];

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            {/* Discovered gradient (Accent Green) */}
            <linearGradient id="colorDiscovered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
            </linearGradient>

            {/* Sent gradient (Blue Chart-1) */}
            <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
            horizontal={true}
          />

          <XAxis
            dataKey="week"
            stroke="none"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="none"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="discovered"
            name="Leads Discovered"
            stroke="var(--accent)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDiscovered)"
          />
          <Area
            type="monotone"
            dataKey="emailsSent"
            name="Emails Sent"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSent)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
