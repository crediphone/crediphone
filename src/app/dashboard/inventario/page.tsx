"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowLeftRight, Barcode, ClipboardCheck,
  FileSpreadsheet, MapPin, Search, Package,
} from "lucide-react";

interface HubCard {
  href: string;
  icon: React.ElementType;
  label: string;
  descripcion: string;
  color: string;
  bg: string;
  badge?: number | null;
}

export default function InventarioHubPage() {
  const router = useRouter();
  const [alertasCount, setAlertasCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/inventario/alertas")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setAlertasCount(d.data.length);
      })
      .catch(() => {});
  }, []);

  const cards: HubCard[] = [
    {
      href: "/dashboard/inventario/alertas",
      icon: AlertTriangle,
      label: "Alertas de Stock",
      descripcion: "Productos por debajo del mínimo o agotados",
      color: "var(--color-danger)",
      bg: "var(--color-danger-bg)",
      badge: alertasCount,
    },
    {
      href: "/dashboard/inventario/movimientos",
      icon: ArrowLeftRight,
      label: "Movimientos",
      descripcion: "Historial de entradas, salidas y ajustes",
      color: "var(--color-info-text)",
      bg: "var(--color-info-bg)",
    },
    {
      href: "/dashboard/inventario/series",
      icon: Barcode,
      label: "Números de Serie",
      descripcion: "Rastrear equipos individuales por IMEI o serie",
      color: "var(--color-accent)",
      bg: "var(--color-accent-light)",
    },
    {
      href: "/dashboard/inventario/discrepancias",
      icon: Search,
      label: "Discrepancias",
      descripcion: "Diferencias entre inventario esperado y real",
      color: "var(--color-warning-text)",
      bg: "var(--color-warning-bg)",
    },
    {
      href: "/dashboard/inventario/importar",
      icon: FileSpreadsheet,
      label: "Importar",
      descripcion: "Carga masiva de productos desde Excel/CSV",
      color: "var(--color-success-text)",
      bg: "var(--color-success-bg)",
    },
    {
      href: "/dashboard/inventario/verificar",
      icon: ClipboardCheck,
      label: "Verificación",
      descripcion: "Conteo físico y conciliación del inventario",
      color: "var(--color-text-secondary)",
      bg: "var(--color-bg-elevated)",
    },
    {
      href: "/dashboard/inventario/ubicaciones",
      icon: MapPin,
      label: "Ubicaciones",
      descripcion: "Organización de espacios y localización de productos",
      color: "var(--color-text-secondary)",
      bg: "var(--color-bg-elevated)",
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-accent-light)" }}>
            <Package className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              Inventario
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Gestión completa del stock y existencias
            </p>
          </div>
        </div>
      </div>

      {/* Grid de módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <HubCardButton key={card.href} card={card} onClick={() => router.push(card.href)} />
        ))}
      </div>
    </div>
  );
}

function HubCardButton({ card, onClick }: { card: HubCard; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const Icon = card.icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left rounded-2xl p-5 transition-all"
      style={{
        background: hovered ? card.bg : "var(--color-bg-surface)",
        border: `1.5px solid ${hovered ? card.color : "var(--color-border)"}`,
        boxShadow: hovered ? "var(--shadow-md)" : "var(--shadow-sm)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: card.bg }}
        >
          <Icon className="w-5 h-5" style={{ color: card.color }} />
        </div>
        {card.badge != null && card.badge > 0 && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "var(--color-danger)", color: "#fff" }}
          >
            {card.badge}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
        {card.label}
      </p>
      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        {card.descripcion}
      </p>
    </button>
  );
}
