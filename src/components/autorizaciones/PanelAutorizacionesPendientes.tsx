"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SolicitudAutorizacion } from "@/types";
import { useAuth } from "@/components/AuthProvider";

function fmtMonto(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}

function fmtTiempoRestante(expiresAt: Date): string {
  const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const mins = Math.floor(diff / 60000);
  const segs = Math.floor((diff % 60000) / 1000);
  if (mins === 0 && segs === 0) return "expirada";
  if (mins === 0) return `${segs}s`;
  return `${mins}m ${segs}s`;
}

interface ModalRespuestaProps {
  solicitud: SolicitudAutorizacion;
  autorizadorNombre: string;
  onClose: () => void;
  onRespuesta: () => void;
}

function ModalRespuesta({
  solicitud,
  autorizadorNombre,
  onClose,
  onRespuesta,
}: ModalRespuestaProps) {
  const [accion, setAccion] = useState<"aprobar" | "declinar" | null>(null);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!accion) return;
    if (accion === "declinar" && !comentario.trim()) {
      setError("El motivo del rechazo es requerido");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const endpoint =
        accion === "aprobar"
          ? `/api/autorizaciones/${solicitud.id}/aprobar`
          : `/api/autorizaciones/${solicitud.id}/declinar`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autorizadorNombre,
          comentario: comentario.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      onRespuesta();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al procesar"
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{ background: "var(--color-bg-surface)", boxShadow: "var(--shadow-xl)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3
            className="text-base font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Solicitud de descuento
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {solicitud.empleadoNombre}
          </p>
        </div>

        {/* Datos */}
        <div
          className="rounded-xl p-3 space-y-2 text-sm"
          style={{ background: "var(--color-bg-elevated)" }}
        >
          <div className="flex justify-between">
            <span style={{ color: "var(--color-text-muted)" }}>Venta</span>
            <span style={{ fontFamily: "var(--font-data)" }}>
              {fmtMonto(solicitud.montoVenta)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--color-text-muted)" }}>Descuento</span>
            <span
              className="font-bold"
              style={{ color: "var(--color-danger)", fontFamily: "var(--font-data)" }}
            >
              {fmtMonto(solicitud.montoDescuento)} (
              {solicitud.porcentajeCalculado.toFixed(1)}%)
            </span>
          </div>
          <div
            className="flex justify-between pt-1"
            style={{ borderTop: "1px solid var(--color-border-subtle)" }}
          >
            <span style={{ color: "var(--color-text-muted)" }}>Precio final</span>
            <span
              className="font-bold"
              style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}
            >
              {fmtMonto(solicitud.montoVenta - solicitud.montoDescuento)}
            </span>
          </div>
        </div>

        {solicitud.razon && (
          <div
            className="rounded-lg px-3 py-2 text-xs"
            style={{ background: "var(--color-info-bg)", color: "var(--color-info-text)" }}
          >
            <strong>Razón:</strong> {solicitud.razon}
          </div>
        )}

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setAccion("aprobar"); setError(""); }}
            className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{
              background: accion === "aprobar" ? "var(--color-success)" : "var(--color-success-bg)",
              color: accion === "aprobar" ? "#fff" : "var(--color-success)",
              border: "1.5px solid var(--color-success)",
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Aprobar
          </button>
          <button
            onClick={() => { setAccion("declinar"); setError(""); }}
            className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{
              background: accion === "declinar" ? "var(--color-danger)" : "var(--color-danger-bg)",
              color: accion === "declinar" ? "#fff" : "var(--color-danger)",
              border: "1.5px solid var(--color-danger)",
            }}
          >
            <XCircle className="w-4 h-4" />
            Rechazar
          </button>
        </div>

        {accion && (
          <div>
            <textarea
              rows={2}
              value={comentario}
              onChange={(e) => { setComentario(e.target.value); setError(""); }}
              placeholder={
                accion === "declinar"
                  ? "Motivo del rechazo *"
                  : "Comentario opcional"
              }
              className="w-full px-3 py-2 rounded-xl text-sm resize-none focus:outline-none"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
        )}

        {error && (
          <p className="text-xs" style={{ color: "var(--color-danger)" }}>
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          {accion && (
            <Button
              variant={accion === "aprobar" ? "primary" : "danger"}
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || (accion === "declinar" && !comentario.trim())}
            >
              {submitting ? "..." : accion === "aprobar" ? "Aprobar" : "Rechazar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

interface PanelAutorizacionesPendientesProps {
  compact?: boolean;
  className?: string;
}

export function PanelAutorizacionesPendientes({
  compact = false,
  className = "",
}: PanelAutorizacionesPendientesProps) {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState<SolicitudAutorizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);
  const [solicitudActiva, setSolicitudActiva] = useState<SolicitudAutorizacion | null>(null);
  const [, setTick] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/autorizaciones");
      const data = await res.json();
      if (data.success) {
        setSolicitudes(data.data);
      }
    } catch {
      // silenciar
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 5000); // poll cada 5s
    return () => clearInterval(interval);
  }, [cargar]);

  // Tick para actualizar el countdown en pantalla
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!user || !["admin", "super_admin"].includes(user.role)) return null;

  if (solicitudes.length === 0 && !loading) return null;

  const autorizadorNombre = user.name ?? user.email ?? "Administrador";

  const handleRespuesta = () => {
    setSolicitudActiva(null);
    cargar();
  };

  return (
    <>
      <div
        className={`rounded-2xl overflow-hidden ${className}`}
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-danger)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Header */}
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          style={{
            background: "var(--color-danger-bg)",
            borderBottom: expanded
              ? "1px solid var(--color-danger)"
              : "none",
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert
              className="w-5 h-5"
              style={{ color: "var(--color-danger)" }}
            />
            <span
              className="text-sm font-bold"
              style={{ color: "var(--color-danger)" }}
            >
              Descuentos pendientes de autorización
            </span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: "var(--color-danger)",
                color: "#fff",
              }}
            >
              {solicitudes.length}
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
          )}
        </button>

        {/* Lista */}
        {expanded && (
          <div className="divide-y" style={{ borderColor: "var(--color-border-subtle)" }}>
            {loading ? (
              <div className="px-4 py-6 text-center">
                <div
                  className="h-8 rounded-lg animate-pulse mx-auto"
                  style={{ background: "var(--color-bg-elevated)", maxWidth: 200 }}
                />
              </div>
            ) : solicitudes.length === 0 ? null : (
              solicitudes.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3 gap-3"
                >
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {s.empleadoNombre}
                      </span>
                      <span
                        className="text-sm font-bold shrink-0"
                        style={{
                          color: "var(--color-danger)",
                          fontFamily: "var(--font-data)",
                        }}
                      >
                        -{fmtMonto(s.montoDescuento)} ({s.porcentajeCalculado.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-data)" }}
                      >
                        Venta: {fmtMonto(s.montoVenta)}
                      </span>
                      <span
                        className="flex items-center gap-0.5 text-xs"
                        style={{
                          color:
                            new Date(s.expiresAt).getTime() - Date.now() < 60000
                              ? "var(--color-danger)"
                              : "var(--color-warning)",
                        }}
                      >
                        <Clock className="w-3 h-3" />
                        {fmtTiempoRestante(s.expiresAt)}
                      </span>
                    </div>
                  </div>

                  {/* Acciones rápidas */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/autorizar-descuento/${s.linkToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                      title="Abrir página de autorización"
                      style={{ color: "#25D366" }}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                    <Button
                      variant="primary"
                      onClick={() => setSolicitudActiva(s)}
                      className="text-xs px-3 py-1.5"
                    >
                      Responder
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de respuesta inline */}
      {solicitudActiva && (
        <ModalRespuesta
          solicitud={solicitudActiva}
          autorizadorNombre={autorizadorNombre}
          onClose={() => setSolicitudActiva(null)}
          onRespuesta={handleRespuesta}
        />
      )}
    </>
  );
}
