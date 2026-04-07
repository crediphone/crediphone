"use client";

import { useState, FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  style?: React.CSSProperties;
  /** Hace la tarjeta clickeable con hover de elevación */
  onClick?: () => void;
  /** Activa efecto hover aunque no haya onClick */
  interactive?: boolean;
}

const Card: FC<CardProps> = ({
  children,
  className,
  title,
  description,
  style,
  onClick,
  interactive,
}) => {
  const [hovered, setHovered] = useState(false);
  const isClickable = !!(onClick || interactive);

  return (
    <div
      className={cn("rounded-xl p-6", className)}
      onClick={onClick}
      onMouseEnter={() => { if (isClickable) setHovered(true); }}
      onMouseLeave={() => { if (isClickable) setHovered(false); }}
      style={{
        background: "var(--color-bg-surface)",
        border: hovered && isClickable
          ? "1px solid var(--color-border)"
          : "1px solid var(--color-border-subtle)",
        boxShadow: hovered && isClickable ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: hovered && isClickable ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out",
        cursor: isClickable ? "pointer" : undefined,
        ...style,
      }}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3
              className="text-xl font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </h3>
          )}
          {description && (
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export { Card };
export default Card;
