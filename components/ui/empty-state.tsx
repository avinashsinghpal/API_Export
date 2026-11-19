import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl bg-card border border-border border-dashed">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground mb-3">
        <Icon className="w-6 h-6 stroke-[1.8]" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <Button
          variant="accent"
          size="sm"
          onClick={onAction}
          className="mt-4 text-xs font-semibold"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
