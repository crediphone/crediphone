"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  RefreshCw,
  Loader2,
  Phone,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  ChevronLeft,
  BarChart2,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CreditoCarteraVencida } from "@/lib/db/creditos";

// ─── Tipos locales ────────────────────────────────────────────

/** Tipo local del aging report (espeja AgingReport de la API) */
interface AgingBucket {
  key:        string;
  label:      string;
  count:      number;
  saldoTotal: number;
  moraTotal:  number;
  porcentaje: number;
}
interface AgingReport {
  fechaCorte:     string;
  totalCreditos:  number;
  totalCartera:   number;
  totalEnMora:    number;
  tasaMoraConteo: number;
  tasaMoraMonto:  number;
  moraAcumulada:  number;
  buckets:        AgingBucket[];
}

const BUCKET_COLORS: Record<string, { bg: string; bar: string; text: string }> = {
  corriente: { bg: "var(--color-success-bg)", bar: "var(--color-success)", text: "var(--color-success-text)" },
  b1_30:     { bg: "var(--color-info-bg)",    bar: "var(--color-info)",    text: "var(--color-info-text)"    },
  b31_60:    { bg: "var(--color-warning-bg)", bar: "var(--color-warning)", text: "var(--color-warning-text)" },
  b61_90:    { bg: "var(--color-danger-bg)",  bar: "var(--color-danger)",  text: "var(--color-danger-text)"  },
  b91_120:   { bg: "var(--color-danger-bg)",  bar: "var(--color-danger)",  text: "var(--color-danger-text)"  },
  b120plus:  { bg: "var(--color-danger-bg)",  bar: "var(--color-primary)", text: "var(--color-danger-text)"  },
};

interface Resumen {
  total: number;
  totalSaldoPendiente: number;
  totalMoraAcumulada: number;
  promedioDiasMora: number;
  distribucionRiesgo: {
    bajo: number;
    medio: number;
    alto: number;
    critico: number;
  };
}

const RIESGO_CONFIG = {
  bajo: {
    label: "1–7 días",
    bg: "var(--color-warning-bg)",
    text: "var(--color-warning-text)",
    bar: "var(--color-warning)",
  },
  medio: {
    label: "8–30 días",
    bg: "var(--color-warning-bg)",
    text: "var(--color-warning-text)",
    bar: "var(--color-warning)",
  },
  alto: {
    label: "31–60 días",
    bg: "var(--color-danger-bg)",
    text: "var(--color-danger-text)",
    bar: "var(--color-danger)",
  },
  critico: {
    label: "60+ días",
    bg: "var(--color-danger-bg)",
    text: "var(--color-danger-text)",
    bar: "var(--color-danger-text)",
  },
} as const;

function fmt(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Fila de crédito ──────────────────────────────────────────
function CreditoRow({
  c,
  onVerCredito,
}: {
  c: CreditoCarteraVencida;
  onVerCredito: (clienteId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const cfg = RIESGO_CONFIG[c.nivelRiesgo];

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--color-bg-elevated)" : "transparent",
        borderBottom: "1px solid var(--color-border-subtle)",
        transition: "background 150ms",
      }}
    >
      <td className="px-4 py-3">
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          {c.clienteNombre}
        </p>
        {c.clienteTelefono && (
          <p
            className="text-xs flex items-center gap-1 mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Phone className="w-3 h-3" />
            {c.clienteTelefono}
          </p>
        )}
        {c.folio && (
          <p className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>
            #{c.folio}
          </p>
        )}
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}
        >
          ${fmt(c.saldoPendiente)}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          de ${fmt(c.monto)}
        </p>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className="text-sm font-bold"
          style={{ color: "var(--color-danger)", fontFamily: "var(--font-data)" }}
        >
          {c.diasMora} días
        </span>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <p
          className="text-sm font-medium"
          style={{ color: "var(--color-danger)", fontFamily: "var(--font-data)" }}
        >
          ${fmt(c.montoMora)}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          ${c.tasaMoraDiaria}/día
        </p>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {new Date(c.fechaFin).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {c.frecuenciaPago} · {c.plazo} meses
        </p>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <span
          style={{
            background: cfg.bg,
            color: cfg.text,
            padding: "2px 8px",
            borderRadius: 9999,
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          {cfg.label}
        </span>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <button
          onClick={() => onVerCredito(c.clienteId)}
          className="text-xs hover:underline"
          style={{ color: "var(--color-accent)" }}
        >
          Ver crédito
        </button>
      </td>
    </tr>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function CarteraVencidaPage() {
  const router = useRouter();
  const [creditos, setCreditos] = useState<CreditoCarteraVencida[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [aging, setAging] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculando, setRecalculando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroRiesgo, setFiltroRiesgo] = useState<string>("todos");
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resCartera, resAging] = await Promise.all([
        fetch("/api/creditos/cartera-vencida"),
        fetch("/api/creditos/aging"),
      ]);
      const dataCartera = await resCartera.json();
      const dataAging   = await resAging.json();

      if (!dataCartera.success) throw new Error(dataCartera.error);
      setCreditos(dataCartera.data.creditos);
      setResumen(dataCartera.data.resumen);

      if (dataAging.success) setAging(dataAging.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar cartera vencida");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const recalcularMora = async () => {
    setRecalculando(true);
    setError(null);
    setMensajeExito(null);
    try {
      const res = await fetch("/api/creditos/recalcular-mora", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMensajeExito(
        `Recálculo completado: ${data.data.enMora} créditos con mora, ${data.data.actualizados} actualizados`
      );
      await cargarDatos();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al recalcular mora");
    } finally {
      setRecalculando(false);
    }
  };

  const creditosFiltrados =
    filtroRiesgo === "todos"
      ? creditos
      : creditos.filter((c) => c.nivelRiesgo === filtroRiesgo);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2
          className="w-10 h-10 animate-spin"
          style={{ color: "var(--color-accent)" }}
        />
      </div>
    );
  }

  const cardStyle = {
    background: "var(--color-bg-surface)",
    borderRadius: "0.75rem",
    border: "1px solid var(--color-border)",
    padding: "1rem",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/creditos")}
            className="p-1.5 rounded-lg transition-colors"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-bg-elevated)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ChevronLeft
              className="w-5 h-5"
              style={{ color: "var(--color-text-secondary)" }}
            />
          </button>
          <div>
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              <AlertTriangle
                className="w-6 h-6"
                style={{ color: "var(--color-danger)" }}
              />
              Cartera Vencida
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Créditos con pagos atrasados — calculado con base en el calendario de pagos
            </p>
          </div>
        </div>
        <Button onClick={recalcularMora} disabled={recalculando} variant="secondary">
          {recalculando ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recalculando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" /> Recalcular mora
            </>
          )}
        </Button>
      </div>

      {/* ── Mensajes ────────────────────────────────────────── */}
      {error && (
        <div
          className="flex items-center gap-2 rounded-lg p-3 text-sm"
          style={{
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-danger)",
            color: "var(--color-danger-text)",
          }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {mensajeExito && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{
            background: "var(--color-success-bg)",
            border: "1px solid var(--color-success)",
            color: "var(--color-success-text)",
          }}
        >
          {mensajeExito}
        </div>
      )}

      {/* ── FASE 43: Reporte de Antigüedad de Saldos ───────────── */}
      {aging && (
        <div
          style={{
            background: "var(--color-bg-surface)",
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          }}
        >
          {/* Encabezado */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
          >
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Reporte de Antigüedad de Saldos
              </h3>
            </div>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Corte: {new Date(aging.fechaCorte).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>

          {/* Tasas de mora real */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: "var(--color-border-subtle)" }}>
            {[
              {
                icon: Percent,
                label: "Tasa mora (conteo)",
                value: `${aging.tasaMoraConteo}%`,
                sub: `${aging.buckets.find((b) => b.key !== "corriente")?.count ?? 0} de ${aging.totalCreditos} créditos`,
                color: aging.tasaMoraConteo > 20 ? "var(--color-danger)" : aging.tasaMoraConteo > 10 ? "var(--color-warning)" : "var(--color-success)",
              },
              {
                icon: Percent,
                label: "Tasa mora (monto)",
                value: `${aging.tasaMoraMonto}%`,
                sub: `$${fmt(aging.totalEnMora)} en riesgo`,
                color: aging.tasaMoraMonto > 20 ? "var(--color-danger)" : aging.tasaMoraMonto > 10 ? "var(--color-warning)" : "var(--color-success)",
              },
              {
                icon: DollarSign,
                label: "Cartera total activa",
                value: `$${fmt(aging.totalCartera)}`,
                sub: `${aging.totalCreditos} créditos vigentes`,
                color: "var(--color-text-primary)",
              },
              {
                icon: TrendingUp,
                label: "Mora acumulada total",
                value: `$${fmt(aging.moraAcumulada)}`,
                sub: "interés moratorio generado",
                color: aging.moraAcumulada > 0 ? "var(--color-danger)" : "var(--color-success)",
              },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div
                key={label}
                className="p-4"
                style={{ background: "var(--color-bg-surface)" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color, fontFamily: "var(--font-data)" }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Tabla de buckets */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: "var(--color-bg-elevated)" }}>
                <tr>
                  {["Antigüedad", "# Créditos", "Saldo pendiente", "Mora acumulada", "% Cartera"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aging.buckets.map((bucket) => {
                  const colors = BUCKET_COLORS[bucket.key] ?? BUCKET_COLORS["b120plus"];
                  return (
                    <tr
                      key={bucket.key}
                      style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                    >
                      {/* Antigüedad con barra */}
                      <td className="px-4 py-3 min-w-[180px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: colors.bar }}
                          />
                          <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                            {bucket.label}
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: "var(--color-bg-elevated)", width: "100px" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, bucket.porcentaje)}%`,
                              background: colors.bar,
                            }}
                          />
                        </div>
                      </td>
                      {/* Conteo */}
                      <td className="px-4 py-3">
                        {bucket.count > 0 ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: colors.bg, color: colors.text }}
                          >
                            {bucket.count}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
                        )}
                      </td>
                      {/* Saldo */}
                      <td className="px-4 py-3">
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: bucket.saldoTotal > 0 ? colors.text : "var(--color-text-muted)",
                            fontFamily: "var(--font-data)",
                          }}
                        >
                          {bucket.saldoTotal > 0 ? `$${fmt(bucket.saldoTotal)}` : "—"}
                        </span>
                      </td>
                      {/* Mora */}
                      <td className="px-4 py-3">
                        <span
                          className="text-sm"
                          style={{
                            color: bucket.moraTotal > 0 ? "var(--color-danger)" : "var(--color-text-muted)",
                            fontFamily: "var(--font-data)",
                          }}
                        >
                          {bucket.moraTotal > 0 ? `$${fmt(bucket.moraTotal)}` : "—"}
                        </span>
                      </td>
                      {/* Porcentaje */}
                      <td className="px-4 py-3">
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{
                            color: bucket.porcentaje > 0 ? colors.text : "var(--color-text-muted)",
                            fontFamily: "var(--font-data)",
                          }}
                        >
                          {bucket.porcentaje > 0 ? `${bucket.porcentaje.toFixed(1)}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tarjetas de resumen ─────────────────────────────── */}
      {resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Créditos en mora
              </span>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-danger)", fontFamily: "var(--font-data)" }}
            >
              {resumen.total}
            </p>
          </div>

          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Saldo pendiente
              </span>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-warning)", fontFamily: "var(--font-data)" }}
            >
              ${fmt(resumen.totalSaldoPendiente)}
            </p>
          </div>

          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Mora acumulada
              </span>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-danger)", fontFamily: "var(--font-data)" }}
            >
              ${fmt(resumen.totalMoraAcumulada)}
            </p>
          </div>

          <div style={cardStyle}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Promedio días mora
              </span>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}
            >
              {resumen.promedioDiasMora} días
            </p>
          </div>
        </div>
      )}

      {/* ── Distribución por riesgo ─────────────────────────── */}
      {resumen && (
        <div
          style={{
            background: "var(--color-bg-surface)",
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border)",
            padding: "1rem",
          }}
        >
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Distribución por nivel de riesgo
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(["bajo", "medio", "alto", "critico"] as const).map((nivel) => {
              const cfg = RIESGO_CONFIG[nivel];
              const count = resumen.distribucionRiesgo[nivel];
              const pct = resumen.total > 0 ? Math.round((count / resumen.total) * 100) : 0;
              const isActive = filtroRiesgo === nivel;
              return (
                <button
                  key={nivel}
                  onClick={() => setFiltroRiesgo(isActive ? "todos" : nivel)}
                  className="p-3 rounded-lg text-left transition-all"
                  style={{
                    background: cfg.bg,
                    color: cfg.text,
                    border: isActive ? `2px solid ${cfg.text}` : "2px solid transparent",
                    opacity: isActive ? 1 : 0.8,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.opacity = "0.8";
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
                    </span>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                  <p className="text-xs opacity-75">{cfg.label}</p>
                  <div
                    className="mt-2 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(0,0,0,0.1)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: cfg.bar }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          {filtroRiesgo !== "todos" && (
            <button
              onClick={() => setFiltroRiesgo("todos")}
              className="mt-2 text-xs hover:underline"
              style={{ color: "var(--color-accent)" }}
            >
              Mostrar todos
            </button>
          )}
        </div>
      )}

      {/* ── Tabla de créditos en mora ────────────────────────── */}
      {creditosFiltrados.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">
            {filtroRiesgo === "todos"
              ? "No hay créditos en mora"
              : `No hay créditos en riesgo ${filtroRiesgo}`}
          </p>
          <p className="text-sm mt-1">
            Presiona &quot;Recalcular mora&quot; para actualizar los datos
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--color-bg-surface)",
            borderRadius: "0.75rem",
            border: "1px solid var(--color-border)",
            overflow: "hidden",
          }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              {creditosFiltrados.length} crédito{creditosFiltrados.length !== 1 ? "s" : ""}
              {filtroRiesgo !== "todos" && ` — riesgo ${filtroRiesgo}`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: "var(--color-bg-elevated)" }}>
                <tr>
                  {[
                    "Cliente",
                    "Saldo pendiente",
                    "Días mora",
                    "Mora acumulada",
                    "Vence",
                    "Riesgo",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creditosFiltrados.map((c) => (
                  <CreditoRow
                    key={c.id}
                    c={c}
                    onVerCredito={(clienteId) =>
                      router.push(`/dashboard/creditos?cliente=${clienteId}`)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
