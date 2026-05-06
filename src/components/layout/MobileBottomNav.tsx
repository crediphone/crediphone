"use client";

/**
 * CREDIPHONE — Barra de navegación inferior para mobile
 *
 * Solo visible en pantallas < lg (1024px).
 * Muestra los módulos más relevantes por rol para acceso rápido,
 * sin necesidad de abrir el sidebar.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  Store,
  Users,
  CreditCard,
  Wallet,
  ClipboardList,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

interface NavTab {
  label: string;
  href?: string;
  icon: React.ElementType;
  action?: () => void;
  matchPaths?: string[];
}

interface MobileBottomNavProps {
  onOpenSidebar: () => void;
}

export function MobileBottomNav({ onOpenSidebar }: MobileBottomNavProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const role = user?.role ?? "admin";

  const tabsPorRol: Record<string, NavTab[]> = {
    tecnico: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Reparaciones", href: "/dashboard/reparaciones", icon: ClipboardList, matchPaths: ["/dashboard/reparaciones", "/dashboard/dashboard-reparaciones"] },
      { label: "Mi Panel", href: "/dashboard/tecnico", icon: Wrench },
      { label: "Menú", icon: Menu, action: onOpenSidebar },
    ],
    vendedor: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "POS", href: "/dashboard/pos", icon: Store, matchPaths: ["/dashboard/pos"] },
      { label: "Clientes", href: "/dashboard/clientes", icon: Users },
      { label: "Créditos", href: "/dashboard/creditos", icon: CreditCard },
      { label: "Menú", icon: Menu, action: onOpenSidebar },
    ],
    cobrador: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Cartera", href: "/dashboard/creditos/cartera-vencida", icon: CreditCard },
      { label: "Pagos", href: "/dashboard/pagos", icon: Wallet },
      { label: "Clientes", href: "/dashboard/clientes", icon: Users },
      { label: "Menú", icon: Menu, action: onOpenSidebar },
    ],
    admin: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Reparaciones", href: "/dashboard/reparaciones", icon: Wrench, matchPaths: ["/dashboard/reparaciones", "/dashboard/dashboard-reparaciones"] },
      { label: "POS", href: "/dashboard/pos", icon: Store, matchPaths: ["/dashboard/pos"] },
      { label: "Clientes", href: "/dashboard/clientes", icon: Users },
      { label: "Menú", icon: Menu, action: onOpenSidebar },
    ],
    super_admin: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Reparaciones", href: "/dashboard/reparaciones", icon: Wrench, matchPaths: ["/dashboard/reparaciones", "/dashboard/dashboard-reparaciones"] },
      { label: "POS", href: "/dashboard/pos", icon: Store, matchPaths: ["/dashboard/pos"] },
      { label: "Clientes", href: "/dashboard/clientes", icon: Users },
      { label: "Menú", icon: Menu, action: onOpenSidebar },
    ],
  };

  const tabs = tabsPorRol[role] ?? tabsPorRol["admin"];

  function isActive(tab: NavTab): boolean {
    if (!tab.href) return false;
    // Tab "Dashboard": solo activo en la ruta exacta
    if (tab.href === "/dashboard") return pathname === "/dashboard";
    // Tabs con matchPaths alternativos
    if (tab.matchPaths) {
      return tab.matchPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
    }
    return pathname === tab.href || pathname.startsWith(tab.href + "/");
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex"
      style={{
        background: "var(--color-bg-surface)",
        borderTop: "1px solid var(--color-border)",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
        height: "56px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {tabs.map((tab) => (
        <TabItem key={tab.label} tab={tab} active={isActive(tab)} />
      ))}
    </nav>
  );
}

function TabItem({ tab, active }: { tab: NavTab; active: boolean }) {
  const [hov, setHov] = useState(false);
  const Icon = tab.icon;

  const color = active
    ? "var(--color-accent)"
    : hov
    ? "var(--color-text-primary)"
    : "var(--color-text-muted)";

  const inner = (
    <div
      className="flex flex-col items-center justify-center gap-0.5 w-full h-full"
      style={{ color }}
    >
      <Icon className="w-5 h-5" />
      <span style={{ fontSize: "0.65rem", fontWeight: active ? 600 : 400, lineHeight: 1 }}>
        {tab.label}
      </span>
      {active && (
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{
            width: "24px",
            height: "2px",
            background: "var(--color-accent)",
            borderRadius: "0 0 2px 2px",
          }}
        />
      )}
    </div>
  );

  const commonStyle: React.CSSProperties = {
    flex: 1,
    position: "relative",
    background: hov && !active ? "var(--color-bg-elevated)" : "transparent",
    transition: "background 120ms ease",
    border: "none",
    cursor: "pointer",
    padding: 0,
  };

  if (tab.action) {
    return (
      <button
        style={commonStyle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={tab.action}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={tab.href!}
      style={commonStyle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {inner}
    </Link>
  );
}
