// components/ui/dialog-icon.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type DialogIconProps = {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  className?: string;
};

const variantStyles = {
  default: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function DialogIcon({
  children,
  variant = "default",
  className,
}: DialogIconProps) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
