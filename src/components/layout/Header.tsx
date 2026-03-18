"use client";

import { FC, useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, LogIn, LayoutDashboard } from "lucide-react";
import { CampanaNotificaciones } from "@/components/notificaciones/CampanaNotificaciones";

const Header: FC = () => {
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [autenticado, setAutenticado] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.success && data.user) {
          setUsuarioId(data.user.id);
          setAutenticado(true);
        }
      } catch {
        // Sin usuario autenticado
      }
    }
    fetchUser();
  }, []);

  return (
    <header
      style={{
        background: "var(--color-bg-surface)",
        borderBottom: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}
            >
              CREDIPHONE
            </h1>
          </div>
          <div className="flex items-center gap-3">

            {/* Toggle modo oscuro/claro */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--color-accent)";
                  (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            {/* Campana de notificaciones (solo si autenticado) */}
            {usuarioId && <CampanaNotificaciones usuarioId={usuarioId} />}

            {/* Botón de acceso al sistema */}
            {autenticado ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ background: "var(--color-primary)", color: "var(--color-primary-text)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-primary-mid)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-primary)";
                }}
              >
                <LayoutDashboard className="w-4 h-4" />
                Ir al Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{ background: "var(--color-primary)", color: "var(--color-primary-text)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-primary-mid)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-primary)";
                }}
              >
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
