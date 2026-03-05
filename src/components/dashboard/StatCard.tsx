"use client";

import { CSSProperties, ReactNode, useState } from "react";
import Link from "next/link";
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
  /** Convierte la card en un link clicable */
  href?: string;
  /** Barra de progreso al fondo (0-100) */
  progress?: number;
}

const iconStyles: Record<string, CSSProperties> = {
  blue:   { background: "var(--color-info-bg)",      color: "var(--color-info)" },
  green:  { background: "var(--color-success-bg)",   color: "var(--color-success)" },
  yellow: { background: "var(--color-warning-bg)",   color: "var(--color-warning)" },
  red:    { background: "var(--color-danger-bg)",    color: "var(--color-danger)" },
  purple: { background: "var(--color-accent-light)", color: "var(--color-accent)" },
};

const progressColors: Record<string, string> = {
  blue:   "var(--color-info)",
  green:  "var(--color-success)",
  yellow: "var(--color-warning)",
  red:    "var(--color-danger)",
  purple: "var(--color-accent)",
};

function StatCardInner({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = "blue",
  href,
  progress,
  hovered,
}: StatCardProps & { hovered: boolean }) {
  return (
    <Card
      style={{
        transition: "all 200ms var(--ease-spring)",
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        cursor: href ? "pointer" : "default",
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium mb-1 flex items-center gap-1.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {title}
            {href && (
              <svg
                className="w-3.5 h-3.5 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </p>

          <p
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}
          >
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
          <div className="p-3 rounded-lg flex-shrink-0 ml-3" style={iconStyles[color]}>
            {icon}
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      {progress !== undefined && (
        <div className="mt-3">
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
                background: progressColors[color],
                transition: "width 600ms var(--ease-smooth)",
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

export function StatCard(props: StatCardProps) {
  const [hovered, setHovered] = useState(false);

  if (props.href) {
    return (
      <Link
        href={props.href}
        className="block"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <StatCardInner {...props} hovered={hovered} />
      </Link>
    );
  }

  return <StatCardInner {...props} hovered={false} />;
}
