"use client";

/* ─────────────────────────────────────────────────────────
   error.tsx — Error boundary de la ruta /auth/login
   Se activa si page.tsx lanza un error no capturado.
   Los errores de auth (credenciales, magic link) se manejan
   dentro del componente con state — este es para errores
   de runtime inesperados (chunk load fail, etc.)
───────────────────────────────────────────────────────── */

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface LoginErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LoginError({ error, reset }: LoginErrorProps) {
  useEffect(() => {
    // Log en consola para debugging — no exponer al usuario
    console.error("[LoginError boundary]", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 flex flex-col items-center text-center gap-6"
        style={{
          background: "var(--color-bg-surface)",
          border:     "1px solid var(--color-border-subtle)",
          boxShadow:  "var(--shadow-md)",
        }}
      >
        {/* Ícono de error */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "var(--color-danger-bg)" }}
        >
          <AlertTriangle
            className="w-8 h-8"
            style={{ color: "var(--color-danger)" }}
          />
        </div>

        {/* Texto */}
        <div className="space-y-2">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Algo salió mal
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            No se pudo cargar la página de inicio de sesión.
            Esto puede deberse a una conexión inestable o un error temporal.
          </p>

          {/* Código de error — solo si hay digest, discreto */}
          {error.digest && (
            <p
              className="text-xs mt-3 px-3 py-1.5 rounded-md inline-block"
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--color-bg-elevated)",
                color:      "var(--color-text-muted)",
                border:     "1px solid var(--color-border-subtle)",
              }}
            >
              Ref: {error.digest}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3 w-full">
          {/* Reintentar */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold"
            style={{
              background: "var(--color-primary)",
              color:      "var(--color-primary-text)",
              border:     "none",
              fontFamily: "var(--font-ui)",
              cursor:     "pointer",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--color-primary-mid)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--color-primary)")
            }
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </button>

          {/* Ir al inicio */}
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium"
            style={{
              background: "var(--color-bg-elevated)",
              color:      "var(--color-text-secondary)",
              border:     "1px solid var(--color-border-subtle)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background  = "var(--color-bg-sunken)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background  = "var(--color-bg-elevated)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
            }}
          >
            <Home className="w-4 h-4" />
            Ir al inicio
          </Link>
        </div>

        {/* Nota de soporte */}
        <p
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          Si el problema persiste, contacta a soporte técnico.
        </p>
      </div>
    </div>
  );
}
