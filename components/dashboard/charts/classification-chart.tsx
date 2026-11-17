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

interface ClassificationChartProps {
  leads: Lead[];
}

export function ClassificationChart({ leads }: ClassificationChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 250);
    return () => clearTimeout(timer);
  }, []);

  // Compute confidence distribution buckets
  const b2bLeads = leads.filter((l) => l.aiClass === "b2b");
  const consumerLeads = leads.filter((l) => l.aiClass === "consumer");
  const unclassified = leads.filter((l) => l.aiClass === null);

  const buckets = [
    { range: "50-70%", b2b: 0, consumer: 0 },
    { range: "71-80%", b2b: 0, consumer: 0 },
    { range: "81-90%", b2b: 0, consumer: 0 },
    { range: "91-100%", b2b: 0, consumer: 0 },
  ];

  leads.forEach((l) => {
    if (!l.aiClass) return;
    const score = l.aiConfidence * 100;
    const bucket =
      score < 71
        ? buckets[0]
        : score < 81
        ? buckets[1]
        : score < 91
        ? buckets[2]
        : buckets[3];

    if (l.aiClass === "b2b") bucket.b2b += 1;
    else bucket.consumer += 1;
  });

  if (!mounted) {
    return <div className="h-[220px] w-full animate-pulse rounded-lg bg-secondary/30" />;
  }

  return (
    <div className="space-y-4">
      {/* Top Split Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-secondary/40 border border-border text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Verified B2B
          </p>
          <p className="text-xl font-bold font-mono text-accent mt-0.5">{b2bLeads.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/40 border border-border text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Retail / Consumers
          </p>
          <p className="text-xl font-bold font-mono text-warning mt-0.5">
            {consumerLeads.length}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/40 border border-border text-center">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Pending AI
          </p>
          <p className="text-xl font-bold font-mono text-muted-foreground mt-0.5">
            {unclassified.length}
          </p>
        </div>
      </div>

      {/* Bar Chart Confidence distribution */}
      <div className="h-[180px] w-full">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Gemini Confidence Distribution
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets}
            margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
              horizontal={true}
            />
            <XAxis
              dataKey="range"
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
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border border-border bg-card p-2.5 shadow-xl text-xs space-y-1">
                      <p className="font-semibold text-foreground">Score: {label}</p>
                      {payload.map((p) => (
                        <div key={p.name} className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">{p.name}:</span>
                          <span className="font-mono font-bold text-foreground">
                            {p.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="b2b" name="B2B Commercial" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="consumer"
              name="Consumer / Individual"
              fill="var(--chart-3)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
