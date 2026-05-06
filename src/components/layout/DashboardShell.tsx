"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, LogOut, ArrowLeft, ChevronDown } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { CampanaNotificaciones } from "@/components/notificaciones/CampanaNotificaciones";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ConfigProvider, useConfig } from "@/components/ConfigProvider";
import { DistribuidorProvider } from "@/components/DistribuidorProvider";
import { useNotificacionesRealtime } from "@/hooks/useNotificacionesRealtime";
import { MobileBottomNav } from "./MobileBottomNav";

// ── Etiquetas de rutas para el breadcrumb ────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard/reparaciones": "Reparaciones",
  "/dashboard/dashboard-reparaciones": "KPIs Reparaciones",
  "/dashboard/tecnico": "Panel Técnico",
  "/dashboard/pos": "Punto de Venta",
  "/dashboard/pos/caja": "Caja / Turno",
  "/dashboard/pos/historial": "Historial POS",
  "/dashboard/payjoy": "Payjoy",
  "/dashboard/clientes": "Clientes",
  "/dashboard/clientes/loyalty": "Programa de Puntos",
  "/dashboard/creditos": "Créditos",
  "/dashboard/pagos": "Cobros y Pagos",
  "/dashboard/creditos/cartera-vencida": "Cartera Vencida",
  "/dashboard/recordatorios": "Recordatorios",
  "/dashboard/productos": "Productos",
  "/dashboard/productos/kits": "Kits",
  "/dashboard/servicios": "Servicios",
  "/dashboard/compras": "Órdenes de Compra",
  "/dashboard/lotes-piezas": "Lotes de Piezas",
  "/dashboard/inventario": "Inventario",
  "/dashboard/inventario/alertas": "Alertas de Stock",
  "/dashboard/inventario/movimientos": "Movimientos",
  "/dashboard/inventario/series": "Series",
  "/dashboard/inventario/discrepancias": "Discrepancias",
  "/dashboard/inventario/ubicaciones": "Ubicaciones",
  "/dashboard/inventario/importar": "Importar Excel",
  "/dashboard/inventario/verificar": "Verificar",
  "/dashboard/reportes": "Reportes",
  "/dashboard/reportes/comisiones": "Comisiones",
  "/dashboard/reportes/equipos": "Equipos",
  "/dashboard/reportes/rentabilidad": "Rentabilidad",
  "/dashboard/facturacion": "Facturación",
  "/dashboard/promociones": "Promociones",
  "/dashboard/empleados": "Empleados",
  "/dashboard/asistencia": "Asistencia",
  "/dashboard/admin/catalogo-reparaciones": "Catálogo Reparaciones",
  "/dashboard/admin/distribuidores": "Distribuidores",
  "/dashboard/admin/categorias": "Categorías",
  "/dashboard/admin/proveedores": "Proveedores",
  "/dashboard/configuracion": "Configuración",
  "/dashboard/notificaciones/fallidas": "Notificaciones Fallidas",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  // Longest prefix match
  let best = "";
  let bestLabel = "";
  for (const [route, label] of Object.entries(ROUTE_LABELS)) {
    if (pathname.startsWith(route) && route.length > best.length) {
      best = route;
      bestLabel = label;
    }
  }
  return bestLabel || "";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConfigProvider>
        <DistribuidorProvider>
          <DashboardShellInner>{children}</DashboardShellInner>
        </DistribuidorProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuBtnHover, setMenuBtnHover] = useState(false);
  const [themeBtnHover, setThemeBtnHover] = useState(false);
  const [backBtnHover, setBackBtnHover] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { config } = useConfig();
  const router = useRouter();
  const pathname = usePathname();

  const esRaiz = pathname === "/dashboard";
  const pageTitle = getPageTitle(pathname);

  // Iniciales del usuario para el avatar
  const initials = user?.name
    ? user.name.split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Cerrar menú de usuario al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

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
      setUserMenuOpen(false);
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
          className="h-16 shrink-0 flex items-center gap-2 px-4 sm:px-6"
          style={{
            background: "var(--color-bg-surface)",
            borderBottom: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-xs)",
          }}
          suppressHydrationWarning
        >
          {/* Hamburger — mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg shrink-0"
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

          {/* ← Atrás — visible cuando no estamos en raíz */}
          {!esRaiz && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg shrink-0"
              title="Regresar a la página anterior"
              style={{
                color: backBtnHover
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
                background: backBtnHover
                  ? "var(--color-bg-elevated)"
                  : "transparent",
                transition: "all var(--duration-normal) var(--ease-smooth)",
                fontSize: "0.8rem",
              }}
              onMouseEnter={() => setBackBtnHover(true)}
              onMouseLeave={() => setBackBtnHover(false)}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Atrás</span>
            </button>
          )}

          {/* Breadcrumb / título de página actual */}
          {pageTitle && (
            <span
              className="text-sm font-medium truncate"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {!esRaiz && <span style={{ color: "var(--color-text-muted)" }} className="mr-1 hidden sm:inline">/</span>}
              {pageTitle}
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* User info — desktop */}
          <div className="hidden lg:flex items-center gap-2 mr-1">
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

          <div className="flex items-center gap-2">
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

            {/* Avatar + dropdown de usuario (reemplaza el botón suelto de logout) */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg"
                  title="Menú de usuario"
                  style={{
                    background: userMenuOpen
                      ? "var(--color-bg-elevated)"
                      : "transparent",
                    border: `1px solid ${userMenuOpen ? "var(--color-border-subtle)" : "transparent"}`,
                    transition: "all var(--duration-normal) var(--ease-smooth)",
                    cursor: "pointer",
                  }}
                >
                  {/* Avatar iniciales */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "var(--color-accent-light)",
                      color: "var(--color-accent)",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    {initials}
                  </div>
                  <ChevronDown
                    className="w-3 h-3"
                    style={{
                      color: "var(--color-text-muted)",
                      transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 150ms ease",
                    }}
                  />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 rounded-xl overflow-hidden z-50"
                    style={{
                      background: "var(--color-bg-surface)",
                      border: "1px solid var(--color-border-subtle)",
                      boxShadow: "var(--shadow-lg)",
                    }}
                  >
                    {/* Info del usuario */}
                    <div
                      className="px-4 py-3"
                      style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                    >
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                        {user.name}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                        {user.email}
                      </p>
                      <span
                        className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--color-accent-light)",
                          color: "var(--color-accent)",
                        }}
                      >
                        {user.role}
                      </span>
                    </div>

                    {/* Cerrar sesión */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left"
                      style={{
                        color: "var(--color-danger)",
                        background: "transparent",
                        transition: "background 120ms ease",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "var(--color-danger-bg)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          "transparent";
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content — padding-bottom en mobile para la bottom nav */}
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">{children}</main>
      </div>

      {/* Bottom nav — solo mobile */}
      <MobileBottomNav onOpenSidebar={() => setSidebarOpen(true)} />
    </div>
  );
}
