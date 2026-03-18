"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Share2,
  Loader2,
  MessageCircle,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  solicitudId: string;
  linkToken: string;
  montoVenta: number;
  montoDescuento: number;
  porcentaje: number;
  expiresAt: Date;
  onAprobado: (comentario?: string) => void;
  onDeclinado: (comentario?: string) => void;
  onExpirado: () => void;
  onCancelar: () => void;
}

function fmtMonto(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(n);
}

export function ModalEsperaAutorizacion({
  isOpen,
  solicitudId,
  linkToken,
  montoVenta,
  montoDescuento,
  porcentaje,
  expiresAt,
  onAprobado,
  onDeclinado,
  onExpirado,
  onCancelar,
}: Props) {
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [estado, setEstado] = useState<
    "esperando" | "aprobado" | "declinado" | "expirado"
  >("esperando");
  const [comentario, setComentario] = useState<string | undefined>(undefined);
  const [copiado, setCopiado] = useState(false);

  const linkPublico =
    typeof window !== "undefined"
      ? `${window.location.origin}/autorizar-descuento/${linkToken}`
      : `/autorizar-descuento/${linkToken}`;

  // Calcular tiempo restante
  useEffect(() => {
    if (!isOpen) return;

    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setSegundosRestantes(diff);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isOpen, expiresAt]);

  // Polling cada 3 segundos
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/autorizaciones/${solicitudId}`);
      const data = await res.json();
      if (!data.success) return;

      const { estado: nuevoEstado, comentarioAutorizador } = data.data;

      if (nuevoEstado === "aprobado") {
        setEstado("aprobado");
        setComentario(comentarioAutorizador);
      } else if (nuevoEstado === "declinado") {
        setEstado("declinado");
        setComentario(comentarioAutorizador);
      } else if (nuevoEstado === "expirado") {
        setEstado("expirado");
      }
    } catch {
      // Silenciar errores de red en polling
    }
  }, [solicitudId]);

  useEffect(() => {
    if (!isOpen || estado !== "esperando") return;

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [isOpen, estado, poll]);

  // Notificar al padre cuando cambia el estado
  useEffect(() => {
    if (estado === "aprobado") {
      const timer = setTimeout(() => onAprobado(comentario), 1500);
      return () => clearTimeout(timer);
    }
    if (estado === "declinado") {
      const timer = setTimeout(() => onDeclinado(comentario), 1500);
      return () => clearTimeout(timer);
    }
    if (estado === "expirado" || segundosRestantes === 0) {
      const timer = setTimeout(() => onExpirado(), 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, segundosRestantes]);

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkPublico);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `🔐 Autorización de descuento requerida\n\n` +
      `Vendedor solicita descuento de ${fmtMonto(montoDescuento)} (${porcentaje.toFixed(1)}%) ` +
      `en venta de ${fmtMonto(montoVenta)}.\n\n` +
      `Precio final: ${fmtMonto(montoVenta - montoDescuento)}\n\n` +
      `Autoriza aquí:\n${linkPublico}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const minutos = Math.floor(segundosRestantes / 60);
  const segs = segundosRestantes % 60;
  const progreso = Math.min(
    100,
    ((new Date(expiresAt).getTime() - Date.now()) /
      (5 * 60 * 1000)) *
      100
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancelar}
      title="Esperando autorización"
      size="md"
    >
      <div className="space-y-5">

        {/* Estado visual */}
        {estado === "esperando" && (
          <div className="text-center py-4 space-y-3">
            <div className="relative inline-flex">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-warning-bg)" }}
              >
                <Loader2
                  className="w-10 h-10 animate-spin"
                  style={{ color: "var(--color-warning)" }}
                />
              </div>
            </div>
            <div>
              <p
                className="text-lg font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Solicitud enviada
              </p>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Esperando respuesta del administrador...
              </p>
            </div>
          </div>
        )}

        {estado === "aprobado" && (
          <div className="text-center py-4 space-y-2">
            <CheckCircle2
              className="w-16 h-16 mx-auto"
              style={{ color: "var(--color-success)" }}
            />
            <p className="text-lg font-bold" style={{ color: "var(--color-success)" }}>
              ¡Descuento autorizado!
            </p>
            {comentario && (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {comentario}
              </p>
            )}
          </div>
        )}

        {estado === "declinado" && (
          <div className="text-center py-4 space-y-2">
            <XCircle
              className="w-16 h-16 mx-auto"
              style={{ color: "var(--color-danger)" }}
            />
            <p className="text-lg font-bold" style={{ color: "var(--color-danger)" }}>
              Descuento rechazado
            </p>
            {comentario && (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {comentario}
              </p>
            )}
          </div>
        )}

        {estado === "expirado" && (
          <div className="text-center py-4 space-y-2">
            <Clock
              className="w-16 h-16 mx-auto"
              style={{ color: "var(--color-text-muted)" }}
            />
            <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
              Solicitud expirada
            </p>
          </div>
        )}

        {estado === "esperando" && (
          <>
            {/* Resumen */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-text-muted)" }}>
                  Descuento solicitado
                </span>
                <span
                  className="font-bold"
                  style={{
                    color: "var(--color-warning)",
                    fontFamily: "var(--font-data)",
                  }}
                >
                  {fmtMonto(montoDescuento)} ({porcentaje.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-text-muted)" }}>
                  Precio final
                </span>
                <span
                  className="font-bold"
                  style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-data)",
                  }}
                >
                  {fmtMonto(montoVenta - montoDescuento)}
                </span>
              </div>
            </div>

            {/* Countdown */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: "var(--color-text-muted)" }}>
                  Tiempo restante
                </span>
                <span
                  className="font-mono font-bold"
                  style={{
                    color:
                      segundosRestantes < 60
                        ? "var(--color-danger)"
                        : "var(--color-warning)",
                  }}
                >
                  {minutos}:{segs.toString().padStart(2, "0")}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--color-bg-sunken)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(0, progreso)}%`,
                    background:
                      progreso > 50
                        ? "var(--color-success)"
                        : progreso > 20
                        ? "var(--color-warning)"
                        : "var(--color-danger)",
                  }}
                />
              </div>
            </div>

            {/* Acciones para enviar link */}
            <div className="space-y-2">
              <p
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Envía el link al administrador:
              </p>
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: "#25D366",
                  color: "#fff",
                }}
              >
                <MessageCircle className="w-4 h-4" />
                Enviar por WhatsApp
              </button>
              <button
                onClick={handleCopiarLink}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <Share2 className="w-4 h-4" />
                {copiado ? "¡Copiado!" : "Copiar link"}
              </button>
            </div>

            {/* Cancelar */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={onCancelar}
            >
              Cancelar solicitud
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
