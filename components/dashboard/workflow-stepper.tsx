import * as React from "react";
import { Search, Sparkles, Send, BarChart3, Check, ArrowRight } from "lucide-react";
import { SectionId } from "./sidebar";
import { cn } from "@/lib/utils";

interface WorkflowStepperProps {
  onSelectSection: (section: SectionId) => void;
  stats: {
    totalLeads: number;
    validEmails: number;
    b2bCount: number;
    contactedCount: number;
  };
}

export function WorkflowStepper({ onSelectSection, stats }: WorkflowStepperProps) {
  const steps = [
    {
      id: "discovery" as SectionId,
      number: "1",
      title: "Input & Discovery",
      desc: "US Wholesale Search",
      activeCount: stats.totalLeads,
      icon: Search,
      isDone: stats.totalLeads > 0,
    },
    {
      id: "validation" as SectionId,
      number: "2",
      title: "Enrichment & Hygiene",
      desc: "MX Check & Gemini B2B",
      activeCount: stats.validEmails,
      icon: Sparkles,
      isDone: stats.validEmails > 0 && stats.b2bCount > 0,
    },
    {
      id: "outreach" as SectionId,
      number: "3",
      title: "Outreach Execution",
      desc: "Gmail + Catalog PDF",
      activeCount: stats.contactedCount,
      icon: Send,
      isDone: stats.contactedCount > 0,
    },
    {
      id: "reports" as SectionId,
      number: "4",
      title: "Tracking & Reporting",
      desc: "Replies & Conversions",
      activeCount: stats.contactedCount > 0 ? "Live" : "Ready",
      icon: BarChart3,
      isDone: stats.contactedCount > 0,
    },
  ];

  return (
    <div className="w-full bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onSelectSection(step.id)}
                className={cn(
                  "flex-1 flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 cursor-pointer border group",
                  step.isDone
                    ? "bg-secondary/40 border-accent/30 hover:border-accent hover:bg-secondary/70"
                    : "bg-secondary/20 border-border hover:bg-secondary/40"
                )}
              >
                {/* Step indicator circle */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-semibold transition-colors",
                    step.isDone
                      ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                      : "bg-secondary text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {step.isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.number}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {step.title}
                    </span>
                    <Icon className="w-3 h-3 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{step.desc}</p>
                </div>

                {typeof step.activeCount === "number" && (
                  <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-secondary text-accent border border-accent/20">
                    {step.activeCount}
                  </span>
                )}
              </button>

              {idx < steps.length - 1 && (
                <div className="hidden lg:flex items-center justify-center text-muted-foreground/40 px-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
