"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Lead } from "@/lib/types";

interface ValidationDonutChartProps {
  leads: Lead[];
}

export function ValidationDonutChart({ leads }: ValidationDonutChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 250);
    return () => clearTimeout(timer);
  }, []);

  const valid = leads.filter((l) => l.emailValid === true).length;
  const syntaxInvalid = leads.filter(
    (l) => l.emailValid === false && l.emailValidationReason === "syntax_invalid"
  ).length;
  const disposable = leads.filter(
    (l) => l.emailValid === false && l.emailValidationReason === "disposable_domain"
  ).length;
  const noMx = leads.filter(
    (l) => l.emailValid === false && l.emailValidationReason === "no_mx_record"
  ).length;
  const roleBased = leads.filter(
    (l) => l.emailValid === false && l.emailValidationReason === "role_based"
  ).length;

  const data = [
    { name: "Valid Mailbox", value: valid || 1, color: "var(--accent)" },
    { name: "No MX Record", value: noMx || 1, color: "var(--chart-4)" },
    { name: "Disposable Domain", value: disposable || 1, color: "var(--chart-3)" },
    { name: "Syntax Malformed", value: syntaxInvalid || 1, color: "var(--destructive)" },
    { name: "Role-Based Flagged", value: roleBased || 1, color: "var(--chart-5)" },
  ];

  if (!mounted) {
    return <div className="h-[220px] w-full animate-pulse rounded-lg bg-secondary/30" />;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="h-[220px] w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0];
                  return (
                    <div className="rounded-lg border border-border bg-card p-2.5 shadow-xl text-xs">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="font-mono text-muted-foreground mt-0.5">
                        Count: <span className="text-foreground font-bold">{item.value}</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Breakdown stats */}
      <div className="w-full sm:w-1/2 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-mono font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
