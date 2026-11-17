import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "accent";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors select-none",
        {
          "bg-primary/10 text-primary": variant === "default",
          "bg-secondary text-muted-foreground": variant === "secondary",
          "bg-success/15 text-accent border border-success/20": variant === "success" || variant === "accent",
          "bg-warning/15 text-warning border border-warning/20": variant === "warning",
          "bg-destructive/15 text-destructive border border-destructive/20": variant === "destructive",
          "border border-border text-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
