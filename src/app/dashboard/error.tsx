"use client";

/**
 * Dashboard Error Boundary
 * Captura errores de React en cualquier página del dashboard y muestra
 * un UI amigable en lugar del "This page couldn't load" genérico de Next.js.
 */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ChevronLeft } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error para debugging
    console.error("[Dashboard Error Boundary]", error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] px-6"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Ícono */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "var(--color-danger-bg)" }}
        >
          <AlertTriangle
            className="w-8 h-8"
            style={{ color: "var(--color-danger)" }}
          />
        </div>

        {/* Título */}
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-ui)" }}
        >
          Algo salió mal
        </h2>

        {/* Descripción */}
        <p
          className="text-sm mb-6"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Esta página encontró un error inesperado.
          <br />
          Puedes intentar recargarla o regresar al dashboard.
        </p>

        {/* Detalle técnico (solo si hay mensaje) */}
        {error.message && (
          <div
            className="rounded-xl px-4 py-3 mb-6 text-left"
            style={{ background: "var(--color-bg-sunken)" }}
          >
            <p
              className="text-xs"
              style={{
                color: "var(--color-text-muted)",
                fontFamily: "var(--font-mono)",
                wordBreak: "break-word",
              }}
            >
              {error.message}
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-primary-text)",
              boxShadow: "var(--shadow-sm)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-primary-mid)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--color-primary)")
            }
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>

          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-bg-sunken)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--color-bg-elevated)")
            }
          >
            <ChevronLeft className="w-4 h-4" />
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
