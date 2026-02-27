import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variantStyles: Record<string, CSSProperties> = {
  default: {
    background: "var(--color-bg-elevated)",
    color: "var(--color-text-secondary)",
  },
  success: {
    background: "var(--color-success-bg)",
    color: "var(--color-success-text)",
  },
  warning: {
    background: "var(--color-warning-bg)",
    color: "var(--color-warning-text)",
  },
  danger: {
    background: "var(--color-danger-bg)",
    color: "var(--color-danger-text)",
  },
  info: {
    background: "var(--color-info-bg)",
    color: "var(--color-info-text)",
  },
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        className
      )}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}
