"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  LogIn,
  Tag,
  ShoppingCart,
  Percent,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SolicitudAutorizacion } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMonto(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}

function fmtFecha(d: Date | string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

// ─── Estado final ─────────────────────────────────────────────────────────────

function EstadoFinal({ solicitud }: { solicitud: SolicitudAutorizacion }) {
  const esAprobado = solicitud.estado === "aprobado";
  const esDeclinado = solicitud.estado === "declinado";
  const esExpirado = solicitud.estado === "expirado";

  let color = "var(--color-warning)";
  let Icon = Clock;
  let titulo = "Solicitud expirada";
  let mensaje = "Esta solicitud ya no está activa.";

  if (esAprobado) {
    color = "var(--color-success)";
    Icon = CheckCircle2;
    titulo = "Descuento autorizado";
    mensaje = `Descuento de ${fmtMonto(solicitud.montoDescuento)} aprobado por ${solicitud.autorizadorNombre ?? "el administrador"}.`;
  } else if (esDeclinado) {
    color = "var(--color-danger)";
    Icon = XCircle;
    titulo = "Descuento rechazado";
    mensaje = `El descuento de ${fmtMonto(solicitud.montoDescuento)} fue rechazado.`;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center space-y-4"
        style={{
          background: "var(--color-bg-surface)",
          boxShadow: "var(--shadow-lg)",
          border: `1px solid ${color}`,
        }}
      >
        <Icon className="w-14 h-14 mx-auto" style={{ color }} />
        <h2 className="text-xl font-bold" style={{ color }}>
          {titulo}
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {mensaje}
        </p>

        {solicitud.comentarioAutorizador && (
          <div
            className="rounded-lg p-3 text-sm text-left"
            style={{
              background: esAprobado
                ? "var(--color-success-bg)"
                : esDeclinado
                ? "var(--color-danger-bg)"
                : "var(--color-warning-bg)",
              color: esAprobado
                ? "var(--color-success-text)"
                : esDeclinado
                ? "var(--color-danger-text)"
                : "var(--color-warning-text)",
            }}
          >
            <strong>Comentario:</strong> {solicitud.comentarioAutorizador}
          </div>
        )}

        {solicitud.respondidoAt && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {fmtFecha(solicitud.respondidoAt)}
          </p>
        )}

        {!esExpirado && (
          <a
            href="/dashboard"
            className="block mt-4 text-sm font-medium underline"
            style={{ color: "var(--color-accent)" }}
          >
            Ir al dashboard →
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AutorizarDescuentoPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [solicitud, setSolicitud] = useState<SolicitudAutorizacion | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState("");

  const [accion, setAccion] = useState<"aprobar" | "declinar" | null>(null);
  const [comentario, setComentario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);

  // Cargar solicitud
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setErrorData("");
    try {
      const res = await fetch(`/api/autorizar-descuento/${token}`);
      const data = await res.json();
      if (data.success) {
        setSolicitud(data.data);
      } else {
        setErrorData(data.error ?? "Token no válido o expirado");
      }
    } catch {
      setErrorData("Error de conexión");
    } finally {
      setLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const handleSubmit = async () => {
    if (!accion) return;
    if (accion === "declinar" && !comentario.trim()) {
      setErrorSubmit("El motivo del rechazo es requerido");
      return;
    }

    setSubmitting(true);
    setErrorSubmit("");
    setNeedsAuth(false);

    try {
      const res = await fetch(`/api/autorizar-descuento/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion,
          comentario: comentario.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (data.requiresAuth) {
        setNeedsAuth(true);
        return;
      }
      if (!data.success) {
        throw new Error(data.error || "Error al procesar");
      }

      await fetchData();
    } catch (err) {
      setErrorSubmit(err instanceof Error ? err.message : "Error al procesar");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg-base)" }}
      >
        <div className="space-y-4 w-full max-w-sm px-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: "var(--color-bg-elevated)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Token inválido ────────────────────────────────────────────────────────────
  if (errorData || !solicitud) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--color-bg-base)" }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center space-y-4"
          style={{ background: "var(--color-bg-surface)", boxShadow: "var(--shadow-lg)" }}
        >
          <AlertCircle
            className="w-12 h-12 mx-auto"
            style={{ color: "var(--color-danger)" }}
          />
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Link inválido
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {errorData || "Este link no es válido o ya expiró."}
          </p>
          <a
            href="/dashboard"
            className="block text-sm underline"
            style={{ color: "var(--color-accent)" }}
          >
            Ir al dashboard
          </a>
        </div>
      </div>
    );
  }

  // ── Ya respondida / expirada ──────────────────────────────────────────────────
  if (solicitud.estado !== "pendiente") {
    return <EstadoFinal solicitud={solicitud} />;
  }

  // ── Necesita autenticación ────────────────────────────────────────────────────
  if (needsAuth) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--color-bg-base)" }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center space-y-5"
          style={{ background: "var(--color-bg-surface)", boxShadow: "var(--shadow-lg)" }}
        >
          <LogIn
            className="w-12 h-12 mx-auto"
            style={{ color: "var(--color-accent)" }}
          />
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Inicia sesión para autorizar
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Solo el administrador puede autorizar descuentos. Inicia sesión con tu
            cuenta de admin y vuelve a abrir este link.
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() =>
              router.push(`/auth/login?redirect=/autorizar-descuento/${token}`)
            }
          >
            <LogIn className="w-4 h-4 mr-2" />
            Iniciar sesión
          </Button>
          <button
            onClick={() => setNeedsAuth(false)}
            className="text-xs underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // ── Expiración local (cliente) ────────────────────────────────────────────────
  const ahora = new Date();
  const expiresAt = new Date(solicitud.expiresAt);
  const minutosRestantes = Math.max(
    0,
    Math.floor((expiresAt.getTime() - ahora.getTime()) / 60000)
  );

  // ── Formulario principal ──────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div className="max-w-md mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <a
            href="/dashboard"
            className="p-2 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1
              className="text-xl font-bold"
              style={{
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-ui)",
              }}
            >
              Autorizar descuento
            </h1>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              El vendedor está esperando tu respuesta
            </p>
          </div>
        </div>

        {/* Tarjeta de datos */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Monto del descuento */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--color-accent-light)" }}
            >
              <Tag className="w-7 h-7" style={{ color: "var(--color-accent)" }} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                Descuento solicitado
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--color-accent)", fontFamily: "var(--font-data)" }}
              >
                {solicitud.esMontFijo
                  ? fmtMonto(solicitud.montoDescuento)
                  : `${solicitud.porcentajeCalculado.toFixed(1)}%`}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {solicitud.esMontFijo
                  ? `${solicitud.porcentajeCalculado.toFixed(1)}% equivalente`
                  : fmtMonto(solicitud.montoDescuento)}{" "}
                sobre venta de{" "}
                <span style={{ fontFamily: "var(--font-data)" }}>
                  {fmtMonto(solicitud.montoVenta)}
                </span>
              </p>
            </div>
          </div>

          {/* Datos */}
          <div
            className="rounded-xl p-3 space-y-2"
            style={{ background: "var(--color-bg-elevated)" }}
          >
            <Row label="Vendedor" value={solicitud.empleadoNombre ?? "—"} />
            <Row
              label="Venta total"
              value={fmtMonto(solicitud.montoVenta)}
              mono
            />
            <Row
              label="Descuento"
              value={
                solicitud.esMontFijo
                  ? fmtMonto(solicitud.montoDescuento)
                  : `${solicitud.porcentajeCalculado.toFixed(1)}% (${fmtMonto(solicitud.montoDescuento)})`
              }
              mono
            />
            <Row
              label="Precio final"
              value={fmtMonto(solicitud.montoVenta - solicitud.montoDescuento)}
              mono
            />
          </div>

          {/* Razón del vendedor */}
          {solicitud.razon && (
            <div
              className="rounded-xl p-3"
              style={{
                background: "var(--color-info-bg)",
                border: "1px solid var(--color-info)",
              }}
            >
              <p
                className="text-xs font-semibold mb-1"
                style={{ color: "var(--color-info)" }}
              >
                Razón del vendedor:
              </p>
              <p className="text-sm" style={{ color: "var(--color-info-text)" }}>
                {solicitud.razon}
              </p>
            </div>
          )}

          {/* Contexto de items */}
          {solicitud.contexto?.items && solicitud.contexto.items.length > 0 && (
            <div>
              <p
                className="text-xs font-medium mb-2 flex items-center gap-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Productos en la venta
              </p>
              <div className="space-y-1">
                {solicitud.contexto.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-xs py-1"
                    style={{ borderBottom: i < solicitud.contexto!.items.length - 1 ? "1px solid var(--color-border-subtle)" : "none" }}
                  >
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {item.cantidad}× {item.nombre}
                    </span>
                    <span
                      style={{
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-data)",
                      }}
                    >
                      {fmtMonto(item.precio * item.cantidad)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tiempo restante */}
          <div
            className="flex items-center gap-2 rounded-lg p-2.5 text-xs"
            style={{
              background:
                minutosRestantes <= 1
                  ? "var(--color-danger-bg)"
                  : "var(--color-warning-bg)",
              color:
                minutosRestantes <= 1
                  ? "var(--color-danger-text)"
                  : "var(--color-warning-text)",
            }}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {minutosRestantes > 0
                ? `Expira en ~${minutosRestantes} min — el vendedor está esperando`
                : "La solicitud está por expirar"}
            </span>
          </div>
        </div>

        {/* Selector de acción */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--color-bg-surface)", boxShadow: "var(--shadow-sm)" }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            ¿Autorizas este descuento?
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setAccion("aprobar");
                setErrorSubmit("");
              }}
              className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background:
                  accion === "aprobar"
                    ? "var(--color-success)"
                    : "var(--color-success-bg)",
                color:
                  accion === "aprobar" ? "#fff" : "var(--color-success)",
                border: "1.5px solid var(--color-success)",
              }}
            >
              <CheckCircle2 className="w-5 h-5" />
              Sí, autorizar
            </button>
            <button
              onClick={() => {
                setAccion("declinar");
                setErrorSubmit("");
              }}
              className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background:
                  accion === "declinar"
                    ? "var(--color-danger)"
                    : "var(--color-danger-bg)",
                color:
                  accion === "declinar" ? "#fff" : "var(--color-danger)",
                border: "1.5px solid var(--color-danger)",
              }}
            >
              <XCircle className="w-5 h-5" />
              Rechazar
            </button>
          </div>

          {/* Comentario opcional (aprobar) o requerido (declinar) */}
          {accion && (
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {accion === "declinar"
                  ? "Motivo del rechazo *"
                  : "Comentario (opcional)"}
              </label>
              <textarea
                rows={3}
                value={comentario}
                onChange={(e) => {
                  setComentario(e.target.value);
                  setErrorSubmit("");
                }}
                placeholder={
                  accion === "declinar"
                    ? "Ej: El margen no lo permite, precio ya es promocional..."
                    : "Ej: Autorizado por cliente frecuente"
                }
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none focus:outline-none"
                style={{
                  background: "var(--color-bg-sunken)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
          )}

          {/* Error */}
          {errorSubmit && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
              style={{
                background: "var(--color-danger-bg)",
                color: "var(--color-danger)",
              }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorSubmit}
            </div>
          )}

          {/* Botón submit */}
          {accion && (
            <Button
              variant={accion === "aprobar" ? "primary" : "danger"}
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || (accion === "declinar" && !comentario.trim())}
            >
              {submitting
                ? "Procesando..."
                : accion === "aprobar"
                ? "✅ Autorizar descuento"
                : "❌ Rechazar descuento"}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Auxiliar ─────────────────────────────────────────────────────────────────

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span
        className={`text-xs font-medium truncate max-w-[60%] text-right ${
          mono ? "font-mono" : ""
        }`}
        style={{ color: "var(--color-text-secondary)" }}
      >
        {value}
      </span>
    </div>
  );
}
