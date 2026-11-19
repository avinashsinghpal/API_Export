"use client";

import * as React from "react";
import { Lead } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface PipelineFunnelProps {
  leads: Lead[];
  duplicatesBlocked?: number;
}

export function PipelineFunnel({ leads, duplicatesBlocked = 14 }: PipelineFunnelProps) {
  const discovered = leads.length + duplicatesBlocked;
  const deduplicated = leads.length;
  const enriched = leads.filter((l) => (l as any).sourceRef || l.phone).length;
  const emailValid = leads.filter((l) => l.emailValid === true).length;
  const aiB2B = leads.filter((l) => l.aiClass === "b2b").length;

  const steps = [
    { label: "1. Discovered", count: discovered, color: "bg-chart-1" },
    { label: "2. Deduplicated", count: deduplicated, color: "bg-chart-5" },
    { label: "3. Enriched", count: enriched, color: "bg-chart-2" },
    { label: "4. Email Valid", count: emailValid, color: "bg-chart-3" },
    { label: "5. AI-Verified B2B", count: aiB2B, color: "bg-accent" },
  ];

  const max = Math.max(discovered, 1);

  return (
    <div className="space-y-3.5">
      {steps.map((step) => {
        const pct = Math.round((step.count / max) * 100);
        return (
          <div key={step.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{step.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">{pct}%</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatNumber(step.count)}
                </span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${step.color}`}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
