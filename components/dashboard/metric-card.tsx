import * as React from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  icon: LucideIcon;
  index?: number;
  badge?: string;
}

export function MetricCard({
  title,
  value,
  change,
  trend = "up",
  subtitle,
  icon: Icon,
  index = 0,
  badge,
}: MetricCardProps) {
  return (
    <Card
      interactive
      className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-slide"
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              {value}
            </h4>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium">
                {badge}
              </span>
            )}
          </div>
        </div>

        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center transition-colors duration-200 group-hover:bg-accent/10">
          <Icon className="w-4 h-4 text-muted-foreground transition-colors duration-200 group-hover:text-accent" />
        </div>
      </div>

      {(change || subtitle) && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/40 text-xs">
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                trend === "up" && "text-accent",
                trend === "down" && "text-destructive",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
}
