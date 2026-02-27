import { CSSProperties, ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}

const iconStyles: Record<string, CSSProperties> = {
  blue:   { background: "var(--color-info-bg)",    color: "var(--color-info)" },
  green:  { background: "var(--color-success-bg)", color: "var(--color-success)" },
  yellow: { background: "var(--color-warning-bg)", color: "var(--color-warning)" },
  red:    { background: "var(--color-danger-bg)",  color: "var(--color-danger)" },
  purple: { background: "var(--color-accent-light)", color: "var(--color-accent)" },
};

export function StatCard({ title, value, icon, trend, subtitle, color = "blue" }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
            {title}
          </p>
          <p className="text-3xl font-bold mb-2" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
            {value}
          </p>

          {subtitle && (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {subtitle}
            </p>
          )}

          {trend && (
            <div className="flex items-center mt-2">
              <span
                className="text-sm font-medium"
                style={{ color: trend.isPositive ? "var(--color-success)" : "var(--color-danger)" }}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs ml-2" style={{ color: "var(--color-text-muted)" }}>
                vs mes anterior
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div className="p-3 rounded-lg flex-shrink-0" style={iconStyles[color]}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
