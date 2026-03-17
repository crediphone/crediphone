"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { TraspasoAnticipo } from "@/types";
import {
  Banknote, AlertTriangle, CheckCircle2, Clock,
  ArrowRightLeft, Loader2, ShieldAlert, Info,
} from "lucide-react";

const MXN = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

/* ─── Modal confirmar traspaso ─────────────────────────────────────── */
function ModalConfirmarTraspaso({
  isOpen,
  onClose,
  traspaso,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  traspaso: TraspasoAnticipo;
  onSuccess: () => void;
}) {
  const [montoConfirmado, setMontoConfirmado] = useState<number>(traspaso.montoRegistrado);
  const [notasVendedor, setNotasVendedor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMontoConfirmado(traspaso.montoRegistrado);
      setNotasVendedor("");
      setError(null);
    }
  }, [isOpen, traspaso.montoRegistrado]);

  const discrepancia = traspaso.montoRegistrado - montoConfirmado;
  const hayDiscrepancia = Math.abs(discrepancia) > 0.01;

  async function handleConfirmar() {
    if (montoConfirmado < 0) {
      setError("El monto no puede ser negativo");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/traspasos-anticipo/${traspaso.id}/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montoConfirmado, notasVendedor: notasVendedor || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || "Error al confirmar");
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar recepción de efectivo"
      size="md"
    >
      <div className="space-y-5">

        {/* Resumen del traspaso */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border-subtle)" }}>
          <div className="px-4 py-3" style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-border-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              Traspaso de efectivo — {traspaso.folioOrden}
            </p>
          </div>
          <div className="px-4 py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--color-text-secondary)" }}>Técnico</span>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{traspaso.tecnicoNombre || "Técnico"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--color-text-secondary)" }}>Cliente</span>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{traspaso.clienteNombre}</span>
            </div>
            <div className="flex justify-between text-sm pt-1" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Monto que el técnico declaró</span>
              <span className="font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                {MXN(traspaso.montoRegistrado)}
              </span>
            </div>
          </div>
        </div>

        {/* Campo: monto que el vendedor dice haber recibido */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
            ¿Cuánto efectivo recibiste realmente?
          </label>
          <Input
            type="number"
            value={montoConfirmado}
            onChange={(e) => setMontoConfirmado(Number(e.target.value))}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Si recibiste exactamente lo que el técnico registró, deja el monto igual.
          </p>
        </div>

        {/* Alerta de discrepancia */}
        {hayDiscrepancia && (
          <div className="rounded-xl p-4" style={{ background: "var(--color-danger-bg)", border: "1px solid var(--color-danger)" }}>
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-danger)" }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--color-danger-text)" }}>
                  Hay una diferencia de {MXN(Math.abs(discrepancia))}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-danger-text)" }}>
                  {discrepancia > 0
                    ? `El técnico declaró ${MXN(traspaso.montoRegistrado)} pero tú recibes ${MXN(montoConfirmado)}. Esta discrepancia quedará registrada y el administrador recibirá una alerta.`
                    : `Confirmas recibir ${MXN(montoConfirmado)}, que es más de lo declarado por el técnico. Esto también se notificará al administrador.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sin discrepancia — banner verde */}
        {!hayDiscrepancia && montoConfirmado > 0 && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)" }}>
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--color-success)" }} />
            <p className="text-sm" style={{ color: "var(--color-success-text)" }}>
              Monto coincide con lo registrado por el técnico. No habrá discrepancia.
            </p>
          </div>
        )}

        {/* Notas del vendedor (requeridas si hay discrepancia) */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
            {hayDiscrepancia ? "Razón de la diferencia (requerida)" : "Notas (opcional)"}
          </label>
          <textarea
            value={notasVendedor}
            onChange={(e) => setNotasVendedor(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none"
            style={{
              background: "var(--color-bg-sunken)",
              border: `1px solid ${hayDiscrepancia && !notasVendedor ? "var(--color-danger)" : "var(--color-border)"}`,
              color: "var(--color-text-primary)",
            }}
            placeholder={hayDiscrepancia ? "Explica la discrepancia..." : "Observaciones adicionales (opcional)"}
          />
        </div>

        {error && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger-text)" }}>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmar}
            disabled={submitting || (hayDiscrepancia && !notasVendedor.trim())}
            className="flex-1"
          >
            {submitting ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirmando...</span>
            ) : hayDiscrepancia ? (
              <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" />Registrar discrepancia</span>
            ) : (
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Confirmar recepción</span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Panel principal ──────────────────────────────────────────────── */
interface PanelTraspasosPendientesProps {
  /** Si se pasa, muestra solo los traspasos de esa orden */
  reparacionId?: string;
  /** Callback cuando se confirma un traspaso (para refrescar la orden padre) */
  onTraspasoConfirmado?: () => void;
  /** Modo compacto: solo muestra el botón con el contador, sin la tabla */
  compact?: boolean;
}

export function PanelTraspasosPendientes({
  reparacionId,
  onTraspasoConfirmado,
  compact = false,
}: PanelTraspasosPendientesProps) {
  const [traspasos, setTraspasos] = useState<TraspasoAnticipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [traspasoSeleccionado, setTraspasoSeleccionado] = useState<TraspasoAnticipo | null>(null);

  const cargarTraspasos = useCallback(async () => {
    try {
      setLoading(true);
      const url = `/api/traspasos-anticipo?estado=pendiente`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const todos = data.data as TraspasoAnticipo[];
        // Si se especificó una orden, filtrar localmente
        setTraspasos(reparacionId ? todos.filter((t) => t.reparacionId === reparacionId) : todos);
      }
    } catch (e) {
      console.error("Error cargando traspasos:", e);
    } finally {
      setLoading(false);
    }
  }, [reparacionId]);

  useEffect(() => { cargarTraspasos(); }, [cargarTraspasos]);

  function handleConfirmado() {
    cargarTraspasos();
    onTraspasoConfirmado?.();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4" style={{ color: "var(--color-text-muted)" }}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Cargando traspasos pendientes...</span>
      </div>
    );
  }

  if (traspasos.length === 0) {
    if (reparacionId) return null; // No mostrar nada si no hay traspasos para esta orden
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
        style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-muted)" }}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>No hay anticipos pendientes de confirmar.</span>
      </div>
    );
  }

  // Modo compacto: solo banner con conteo + botón expandir
  if (compact) {
    return (
      <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
        style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)" }}
      >
        <div className="flex items-center gap-3">
          <Banknote className="w-5 h-5 shrink-0" style={{ color: "var(--color-warning)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-warning-text)" }}>
              {traspasos.length} anticipo{traspasos.length > 1 ? "s" : ""} pendiente{traspasos.length > 1 ? "s" : ""} de confirmar
            </p>
            <p className="text-xs" style={{ color: "var(--color-warning-text)" }}>
              Total: {MXN(traspasos.reduce((s, t) => s + t.montoRegistrado, 0))}
            </p>
          </div>
        </div>
        <button
          onClick={() => setTraspasoSeleccionado(traspasos[0])}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "var(--color-warning)", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Confirmar
        </button>

        {traspasoSeleccionado && (
          <ModalConfirmarTraspaso
            isOpen={true}
            onClose={() => setTraspasoSeleccionado(null)}
            traspaso={traspasoSeleccionado}
            onSuccess={handleConfirmado}
          />
        )}
      </div>
    );
  }

  // Modo completo: lista de traspasos
  return (
    <div className="space-y-4">
      {/* Header de alerta */}
      <div className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)" }}
      >
        <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "var(--color-warning)" }} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--color-warning-text)" }}>
            {traspasos.length} anticipo{traspasos.length > 1 ? "s" : ""} de efectivo esperando confirmación
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-warning-text)" }}>
            El técnico registró estos montos. Confirma el efectivo que realmente recibiste.
          </p>
        </div>
      </div>

      {/* Aviso de antifraud */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-3 text-xs"
        style={{ background: "var(--color-info-bg)", border: "1px solid var(--color-info)", color: "var(--color-info-text)" }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          El dinero solo entra a caja cuando <strong>tú confirmas</strong> el monto real recibido. Si hay discrepancia, el administrador recibe una alerta automática.
        </span>
      </div>

      {/* Lista de traspasos pendientes */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", boxShadow: "var(--shadow-xs)" }}>
        <div className="px-5 py-4" style={{ background: "var(--color-bg-elevated)", borderBottom: "1px solid var(--color-border-subtle)" }}>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              Traspasos de efectivo — Técnico → Vendedor ({traspasos.length})
            </p>
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: "var(--color-border-subtle)" }}>
          {traspasos.map((t) => {
            const fecha = new Date(t.createdAt);
            const minutosDesde = Math.floor((Date.now() - fecha.getTime()) / 60000);
            const tiempoLabel = minutosDesde < 1 ? "Ahora mismo"
              : minutosDesde < 60 ? `Hace ${minutosDesde} min`
              : minutosDesde < 1440 ? `Hace ${Math.floor(minutosDesde / 60)}h`
              : fecha.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

            return (
              <div key={t.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--color-warning-bg)" }}
                  >
                    <Banknote className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                      {MXN(t.montoRegistrado)}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                      {t.folioOrden} — {t.clienteNombre}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" style={{ color: "var(--color-text-muted)" }} />
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {t.tecnicoNombre || "Técnico"} · {tiempoLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setTraspasoSeleccionado(t)}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: "var(--color-primary)",
                    color: "var(--color-primary-text)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 200ms var(--ease-spring)",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-primary-mid)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-primary)")}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de confirmación */}
      {traspasoSeleccionado && (
        <ModalConfirmarTraspaso
          isOpen={true}
          onClose={() => setTraspasoSeleccionado(null)}
          traspaso={traspasoSeleccionado}
          onSuccess={() => {
            setTraspasoSeleccionado(null);
            handleConfirmado();
          }}
        />
      )}
    </div>
  );
}

/* ─── Badge para sidebar / topbar ─────────────────────────────────── */
export function BadgeTraspasosPendientes() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/traspasos-anticipo?count=true");
        const data = await res.json();
        if (data.success) setCount(data.count || 0);
      } catch {
        // Silencioso
      }
    }
    fetchCount();
    // Refrescar cada 60 segundos
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span
      className="inline-flex items-center justify-center text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1"
      style={{ background: "var(--color-warning)", color: "#fff" }}
    >
      {count}
    </span>
  );
}
