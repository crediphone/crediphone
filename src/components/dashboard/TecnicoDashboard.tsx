"use client";

/**
 * FASE 44 — Dashboard especializado para el rol TÉCNICO.
 * Muestra: órdenes asignadas, estados de reparación y KPIs de desempeño personal.
 */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Wrench, Clock, CheckCircle2, AlertCircle, Star, Package } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/components/AuthProvider";
import type { OrdenReparacionDetallada, EstadoOrdenReparacion } from "@/types";

const ESTADO_META: Record<
  EstadoOrdenReparacion,
  { label: string; color: string; bg: string }
> = {
  recibido:         { label: "Recibido",          color: "var(--color-info)",         bg: "var(--color-info-bg)" },
  diagnostico:      { label: "Diagnóstico",        color: "var(--color-accent)",       bg: "var(--color-accent-light)" },
  esperando_piezas: { label: "Esp. piezas",        color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  presupuesto:      { label: "Presupuesto",        color: "var(--color-warning-text)", bg: "var(--color-warning-bg)" },
  aprobado:         { label: "Aprobado",           color: "var(--color-info)",         bg: "var(--color-info-bg)" },
  en_reparacion:    { label: "En reparación",      color: "var(--color-warning)",      bg: "var(--color-warning-bg)" },
  completado:       { label: "Completado",         color: "var(--color-success)",      bg: "var(--color-success-bg)" },
  listo_entrega:    { label: "Listo p/ entregar",  color: "var(--color-success)",      bg: "var(--color-success-bg)" },
  entregado:        { label: "Entregado",          color: "var(--color-text-muted)",   bg: "var(--color-bg-elevated)" },
  no_reparable:     { label: "No reparable",       color: "var(--color-danger)",       bg: "var(--color-danger-bg)" },
  cancelado:        { label: "Cancelado",          color: "var(--color-danger)",       bg: "var(--color-danger-bg)" },
};

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "var(--color-bg-elevated)" }}
    />
  );
}

export function TecnicoDashboard() {
  const { user } = useAuth();
  const [ordenes, setOrdenes] = useState<OrdenReparacionDetallada[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrdenes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reparaciones?detalladas=true");
      const d = await res.json();
      if (d.success) {
        const todas: OrdenReparacionDetallada[] = d.data;
        // Técnico solo ve las que están en progreso (excluye entregadas/canceladas/no_reparable)
        const activas = todas.filter(
          (o) => !["entregado", "cancelado", "no_reparable"].includes(o.estado)
        );
        setOrdenes(activas);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes]);

  // KPIs calculados a partir de las órdenes cargadas
  const total = ordenes.length;
  const enReparacion = ordenes.filter((o) => o.estado === "en_reparacion").length;
  const listasEntregar = ordenes.filter((o) =>
    ["completado", "listo_entrega"].includes(o.estado)
  ).length;
  const esperandoPiezas = ordenes.filter((o) => o.estado === "esperando_piezas").length;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="p-6 lg:p-8 pb-24">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            {saludo}, {user?.name?.split(" ")[0] || "técnico"} 🔧
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Panel de reparaciones ·{" "}
            {new Date().toLocaleDateString("es-MX", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link href="/dashboard/reparaciones">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "var(--color-accent)",
              color: "white",
              transition: "background 200ms var(--ease-spring)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--color-accent-hover)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--color-accent)")
            }
          >
            <Wrench className="w-4 h-4" />
            Ver todas las órdenes
          </button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))
        ) : (
          [
            { label: "Órdenes activas", value: total, color: "var(--color-accent)", icon: <Wrench className="w-5 h-5" /> },
            { label: "En reparación", value: enReparacion, color: "var(--color-warning)", icon: <Clock className="w-5 h-5" /> },
            { label: "Listas p/ entregar", value: listasEntregar, color: "var(--color-success)", icon: <CheckCircle2 className="w-5 h-5" /> },
            { label: "Esp. piezas", value: esperandoPiezas, color: "var(--color-danger)", icon: <Package className="w-5 h-5" /> },
          ].map((kpi, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 flex items-center justify-between"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
                  {kpi.label}
                </p>
                <p className="text-3xl font-bold" style={{ color: kpi.color, fontFamily: "var(--font-data)" }}>
                  {kpi.value}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${kpi.color}18`, color: kpi.color }}
              >
                {kpi.icon}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lista de órdenes activas */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Mis órdenes activas
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              Haz clic en cualquier orden para ver los detalles y actualizar el estado
            </p>
          </div>
          {total > 0 && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
            >
              {total} activas
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : ordenes.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: "var(--color-success)" }}
            />
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Sin órdenes pendientes
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              Todas las órdenes están entregadas o canceladas
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ordenes.map((orden) => {
              const estadoKey = orden.estado as EstadoOrdenReparacion;
              const meta = ESTADO_META[estadoKey] ?? {
                label: orden.estado,
                color: "var(--color-text-muted)",
                bg: "var(--color-bg-elevated)",
              };

              return (
                <Link key={orden.id} href={`/dashboard/reparaciones/${orden.id}`}>
                  <div
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{
                      background: "var(--color-bg-base)",
                      border: "1px solid var(--color-border-subtle)",
                      transition: "all 180ms var(--ease-smooth)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)";
                      (e.currentTarget as HTMLElement).style.borderColor = meta.color;
                      (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--color-bg-base)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
                      (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                    }}
                  >
                    {/* Estado dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                      style={{ background: meta.color }}
                    />

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-bold"
                          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
                        >
                          {orden.folio}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        {orden.prioridad === "urgente" && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-bold"
                            style={{ background: "var(--color-danger)", color: "white" }}
                          >
                            Urgente
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-0.5 truncate" style={{ color: "var(--color-text-primary)" }}>
                        {orden.marcaDispositivo} {orden.modeloDispositivo}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-secondary)" }}>
                        {orden.clienteNombre} {orden.clienteApellido || ""} · {orden.problemaReportado || "Sin descripción"}
                      </p>
                    </div>

                    {/* Flecha */}
                    <AlertCircle
                      className="w-4 h-4 flex-shrink-0 rotate-180"
                      style={{ color: "var(--color-text-muted)", transform: "rotate(0deg)" }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Accesos rápidos */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/reparaciones", icon: <Wrench className="w-5 h-5" />, label: "Todas las órdenes" },
          { href: "/dashboard/dashboard-reparaciones", icon: <Star className="w-5 h-5" />, label: "Mi desempeño" },
          { href: "/dashboard/tecnico", icon: <Clock className="w-5 h-5" />, label: "Mi panel técnico" },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                boxShadow: "var(--shadow-xs)",
                transition: "all 180ms var(--ease-smooth)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xs)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
              }}
            >
              <span style={{ color: "var(--color-accent)" }}>{item.icon}</span>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
