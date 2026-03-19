import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, style, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {label}
            {props.required && (
              <span className="ml-1" style={{ color: "var(--color-danger)" }}>
                *
              </span>
            )}
          </label>
        )}
        <textarea
          className={cn(
            "flex w-full rounded-md px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "placeholder:text-[var(--color-text-muted)]",
            "resize-vertical",
            className
          )}
          style={{
            background: "var(--color-bg-sunken)",
            border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`,
            color: "var(--color-text-primary)",
            ...style,
          }}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
