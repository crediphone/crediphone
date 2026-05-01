"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  ArrowDown, ArrowUp, ArrowLeftRight, RefreshCw, Filter,
  Package, User, Calendar, FileText, ChevronLeft,
} from "lucide-react";
import type { CSSProperties } from "react";

// ── helpers ────────────────────────────────────────────────────────────────────

function fmtFecha(d: string) {
  return new Date(d).toLocaleString("es-MX", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// ── tipos ──────────────────────────────────────────────────────────────────────

interface MovimientoStock {
  id: string;
  tipo: string;
  cantidad: number;
  stock_antes: number;
  stock_despues: number;
  referencia_tipo: string | null;
  referencia_folio: string | null;
  notas: string | null;
  created_at: string;
  registrado_por: string | null;
  producto: { id: string; nombre: string; marca: string; modelo: string } | null;
}

interface Empleado {
  id: string;
  nombre?: string;
  email?: string;
}

const TIPO_LABELS: Record<string, string> = {
  venta:                  "Venta",
  uso_reparacion:         "Uso en reparación",
  orden_compra:           "Orden de compra",
  ajuste:                 "Ajuste manual",
  devolucion:             "Devolución",
  reserva:                "Reserva",
  liberacion_reserva:     "Liberación de reserva",
  cancelacion_reparacion: "Cancelación de reparación",
};

const TIPO_ICON = (tipo: string, cantidad: number) => {
  if (cantidad > 0) return <ArrowUp size={14} />;
  if (cantidad < 0) return <ArrowDown size={14} />;
  return <ArrowLeftRight size={14} />;
};

const TIPO_COLOR = (cantidad: number): CSSProperties => ({
  color: cantidad > 0 ? "var(--color-success-text)" : cantidad < 0 ? "var(--color-danger)" : "var(--color-text-secondary)",
  background: cantidad > 0 ? "var(--color-success-bg)" : cantidad < 0 ? "var(--color-danger-bg, #fee2e2)" : "var(--color-bg-elevated)",
});

// ── componente principal ───────────────────────────────────────────────────────

export default function MovimientosStockPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [empleados, setEmpleados]     = useState<Empleado[]>([]);
  const [loading, setLoading]         = useState(false);
  const [fecha, setFecha]             = useState(hoyISO());
  const [empleadoId, setEmpleadoId]   = useState("");
  const [tipo, setTipo]               = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const fetchMovimientos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fecha)      params.set("fecha", fecha);
      if (empleadoId) params.set("empleadoId", empleadoId);
      if (tipo)       params.set("tipo", tipo);
      const res = await fetch(`/api/inventario/movimientos?${params}`);
      const data = await res.json();
      if (data.success) setMovimientos(data.data);
    } finally {
      setLoading(false);
    }
  }, [fecha, empleadoId, tipo]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/empleados").then(r => r.json()).then(d => {
      if (d.success) setEmpleados(d.data ?? []);
    }).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchMovimientos();
  }, [fetchMovimientos, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "var(--color-text-secondary)" }}>
        No tienes permiso para ver esta página.
      </div>
    );
  }

  const inputStyle: CSSProperties = {
    background: "var(--color-bg-sunken)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
    borderRadius: "0.75rem",
    padding: "0.375rem 0.75rem",
    fontSize: "0.875rem",
  };

  return (
    <div className="space-y-4 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Movimientos de Stock
        </h1>
      </div>

      {/* Filtros */}
      <div
        className="flex flex-wrap items-end gap-3 p-4 rounded-2xl"
        style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
          <Filter size={14} /> Filtros
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Tipo</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle}>
            <option value="">Todos</option>
            {Object.entries(TIPO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {empleados.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Empleado</label>
            <select value={empleadoId} onChange={e => setEmpleadoId(e.target.value)} style={inputStyle}>
              <option value="">Todos</option>
              {empleados.map(e => (
                <option key={e.id} value={e.id}>{e.nombre || e.email || e.id.slice(0, 8)}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={fetchMovimientos}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Resumen rápido */}
      {movimientos.length > 0 && (() => {
        const entradas = movimientos.filter(m => m.cantidad > 0).reduce((s, m) => s + m.cantidad, 0);
        const salidas  = movimientos.filter(m => m.cantidad < 0).reduce((s, m) => s + Math.abs(m.cantidad), 0);
        return (
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "var(--color-success-bg)", color: "var(--color-success-text)" }}>
              <ArrowUp size={14} /> +{entradas} unidades entraron
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "var(--color-danger-bg, #fee2e2)", color: "var(--color-danger)" }}>
              <ArrowDown size={14} /> -{salidas} unidades salieron
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
              <FileText size={14} /> {movimientos.length} movimientos
            </div>
          </div>
        );
      })()}

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center h-40" style={{ color: "var(--color-text-secondary)" }}>
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando...
        </div>
      ) : movimientos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: "var(--color-text-secondary)" }}>
          <Package size={32} />
          <p className="text-sm">Sin movimientos para los filtros seleccionados</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-border)" }}>
                {["Fecha", "Producto", "Tipo", "Cantidad", "Stock", "Referencia", "Motivo / Notas", "Empleado"].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m, idx) => (
                <tr
                  key={m.id}
                  style={{
                    background: idx % 2 === 0 ? "var(--color-bg-primary)" : "var(--color-bg-elevated)",
                    borderBottom: "1px solid var(--color-border)22",
                  }}
                >
                  <td className="px-3 py-2 font-mono text-xs whitespace-nowrap" style={{ color: "var(--color-text-secondary)" }}>
                    {fmtFecha(m.created_at)}
                  </td>
                  <td className="px-3 py-2">
                    {m.producto ? (
                      <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {m.producto.marca} {m.producto.modelo}
                        <span className="block text-xs" style={{ color: "var(--color-text-secondary)" }}>{m.producto.nombre}</span>
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
                      style={TIPO_COLOR(m.cantidad)}
                    >
                      {TIPO_ICON(m.tipo, m.cantidad)}
                      {TIPO_LABELS[m.tipo] ?? m.tipo}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs font-bold" style={TIPO_COLOR(m.cantidad)}>
                    {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {m.stock_antes} → {m.stock_despues}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
                    {m.referencia_folio || m.referencia_tipo || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs max-w-xs" style={{ color: "var(--color-text-primary)" }}>
                    {m.notas || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
                    {m.registrado_por ? m.registrado_por.slice(0, 8) + "…" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
