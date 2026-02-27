import { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  style?: React.CSSProperties;
}

const Card: FC<CardProps> = ({ children, className, title, description, style }) => {
  return (
    <div
      className={cn("rounded-xl p-6", className)}
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        boxShadow: "var(--shadow-sm)",
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
