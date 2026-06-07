import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "secondary" && "bg-muted text-foreground hover:bg-border",
        variant === "ghost" && "hover:bg-muted",
        variant === "destructive" && "bg-destructive text-white hover:opacity-90",
        variant === "outline" && "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        size === "default" && "h-10 px-4 py-2",
        size === "sm" && "h-8 rounded-md px-3 text-xs",
        size === "lg" && "h-10 rounded-md px-8",
        size === "icon" && "h-9 w-9",
        className
      )}
      {...props}
    />
  );
}

