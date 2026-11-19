import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./button";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({
  title = "Failed to load data",
  message,
  onRetry,
}: ErrorAlertProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-foreground">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
        <div>
          <p className="font-semibold text-destructive">{title}</p>
          <p className="text-muted-foreground mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-7 text-xs gap-1 hover:text-foreground shrink-0 ml-4"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Retry</span>
        </Button>
      )}
    </div>
  );
}
