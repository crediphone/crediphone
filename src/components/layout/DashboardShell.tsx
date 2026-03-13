"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { CampanaNotificaciones } from "@/components/notificaciones/CampanaNotificaciones";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ConfigProvider, useConfig } from "@/components/ConfigProvider";
import { useNotificacionesRealtime } from "@/hooks/useNotificacionesRealtime";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConfigProvider>
        <DashboardShellInner>{children}</DashboardShellInner>
      </ConfigProvider>
    </AuthProvider>
  );
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuBtnHover, setMenuBtnHover] = useState(false);
  const [themeBtnHover, setThemeBtnHover] = useState(false);
  const [logoutBtnHover, setLogoutBtnHover] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { config } = useConfig();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // FASE 28: Registrar Service Worker para push + offline
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) =>
          console.warn("[SW] Error al registrar service worker:", err)
        );
    }
  }, []);

  // FASE 28: Realtime + sonidos de notificación
  useNotificacionesRealtime({
    userId: user?.id,
    sonidosConfig: config?.sonidosConfig,
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesion:", error);
    }
  };

  return (
    <div
      className="flex h-screen"
      style={{ background: "var(--color-bg-base)" }}
      suppressHydrationWarning
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={user?.role || null}
        userName={user?.name || null}
        onLogout={handleLogout}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6"
          style={{
            background: "var(--color-bg-surface)",
            borderBottom: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-xs)",
          }}
          suppressHydrationWarning
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg"
            style={{
              color: menuBtnHover
                ? "var(--color-text-primary)"
                : "var(--color-text-secondary)",
              background: menuBtnHover
                ? "var(--color-bg-elevated)"
                : "transparent",
              transition: "all var(--duration-normal) var(--ease-smooth)",
            }}
            onMouseEnter={() => setMenuBtnHover(true)}
            onMouseLeave={() => setMenuBtnHover(false)}
            suppressHydrationWarning
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* User info - visible on desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {user && (
              <span
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {user.name}{" "}
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--color-accent-light)",
                    color: "var(--color-accent)",
                  }}
                >
                  {user.role}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg"
                title={
                  theme === "dark"
                    ? "Cambiar a modo claro"
                    : "Cambiar a modo oscuro"
                }
                style={{
                  color: themeBtnHover
                    ? "var(--color-accent)"
                    : "var(--color-text-secondary)",
                  background: themeBtnHover
                    ? "var(--color-bg-elevated)"
                    : "transparent",
                  transition: "all var(--duration-normal) var(--ease-smooth)",
                }}
                onMouseEnter={() => setThemeBtnHover(true)}
                onMouseLeave={() => setThemeBtnHover(false)}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Notifications */}
            {user?.id && <CampanaNotificaciones usuarioId={user.id} />}

            {/* Logout button */}
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg"
                title="Cerrar sesion"
                style={{
                  color: logoutBtnHover
                    ? "var(--color-danger)"
                    : "var(--color-text-secondary)",
                  background: logoutBtnHover
                    ? "var(--color-danger-bg)"
                    : "transparent",
                  transition: "all var(--duration-normal) var(--ease-smooth)",
                }}
                onMouseEnter={() => setLogoutBtnHover(true)}
                onMouseLeave={() => setLogoutBtnHover(false)}
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
