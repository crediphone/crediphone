"use client";
import { useState } from "react";
import { Tag, Calendar, ToggleLeft, ToggleRight, Pencil, Trash2 } from "lucide-react";
import type { Promocion } from "@/types";

const CATEGORIA_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  accesorios: { label: "Accesorios",  color: "var(--color-info)",    bg: "var(--color-info-bg)" },
  combos:     { label: "Combos",      color: "var(--color-accent)",  bg: "var(--color-accent-light)" },
  celulares:  { label: "Celulares",   color: "var(--color-primary)", bg: "var(--color-primary-light)" },
  servicios:  { label: "Servicios",   color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
  general:    { label: "General",     color: "var(--color-text-secondary)", bg: "var(--color-bg-elevated)" },
};

interface PromocionCardProps {
  promo: Promocion;
  onEdit: (promo: Promocion) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, activa: boolean) => void;
}

export function PromocionCard({ promo, onEdit, onDelete, onToggle }: PromocionCardProps) {
  const [hov, setHov] = useState(false);
  const cfg = CATEGORIA_CONFIG[promo.categoria] ?? CATEGORIA_CONFIG.general;
  const formatMXN = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);
  const descuento = promo.precioNormal && promo.precioPromocion
    ? Math.round((1 - promo.precioPromocion / promo.precioNormal) * 100)
    : null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--color-bg-surface)",
        border: `1px solid ${hov ? "var(--color-border-strong)" : "var(--color-border-subtle)"}`,
        boxShadow: hov ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        transition: "all 200ms var(--ease-spring)",
        opacity: promo.activa ? 1 : 0.6,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Imagen */}
      {promo.imagenUrl ? (
        <div className="h-36 overflow-hidden">
          <img src={promo.imagenUrl} alt={promo.titulo} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div
          className="h-24 flex items-center justify-center"
          style={{ background: cfg.bg }}
        >
          <Tag className="w-8 h-8" style={{ color: cfg.color, opacity: 0.5 }} />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Badge categoría + activa */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          <button
            onClick={() => onToggle(promo.id, !promo.activa)}
            title={promo.activa ? "Desactivar" : "Activar"}
          >
            {promo.activa
              ? <ToggleRight className="w-5 h-5" style={{ color: "var(--color-success)" }} />
              : <ToggleLeft className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />}
          </button>
        </div>

        {/* Título */}
        <h3 className="text-sm font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
          {promo.titulo}
        </h3>

        {/* Descripción */}
        {promo.descripcion && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
            {promo.descripcion}
          </p>
        )}

        {/* Precios */}
        {(promo.precioNormal || promo.precioPromocion) && (
          <div className="flex items-baseline gap-2">
            {promo.precioPromocion && (
              <span className="text-lg font-bold" style={{ color: "var(--color-success)", fontFamily: "var(--font-data)" }}>
                {formatMXN(promo.precioPromocion)}
              </span>
            )}
            {promo.precioNormal && (
              <span className="text-sm line-through" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-data)" }}>
                {formatMXN(promo.precioNormal)}
              </span>
            )}
            {descuento && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}
              >
                -{descuento}%
              </span>
            )}
          </div>
        )}

        {/* Fechas */}
        {(promo.fechaInicio || promo.fechaFin) && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <Calendar className="w-3 h-3" />
            {promo.fechaInicio && <span>{new Date(promo.fechaInicio).toLocaleDateString("es-MX")}</span>}
            {promo.fechaInicio && promo.fechaFin && <span>→</span>}
            {promo.fechaFin && <span>{new Date(promo.fechaFin).toLocaleDateString("es-MX")}</span>}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onEdit(promo)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button
            onClick={() => { if (confirm(`¿Eliminar "${promo.titulo}"?`)) onDelete(promo.id); }}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)", border: "1px solid var(--color-danger)" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
