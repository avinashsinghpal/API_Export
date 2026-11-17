import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "accent"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]":
              variant === "default",
            "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm active:scale-[0.98] font-semibold":
              variant === "accent",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]":
              variant === "destructive",
            "border border-border bg-transparent hover:bg-secondary hover:text-foreground active:scale-[0.98]":
              variant === "outline",
            "bg-secondary text-foreground hover:bg-secondary/80 active:scale-[0.98]":
              variant === "secondary",
            "hover:bg-secondary/70 hover:text-foreground": variant === "ghost",
            "text-accent underline-offset-4 hover:underline p-0 h-auto":
              variant === "link",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-lg px-6 text-base": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
