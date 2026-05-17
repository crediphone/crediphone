"use client";

/**
 * ModalNotificarListoEntrega
 *
 * Se muestra cuando el técnico hace clic en "Recordar al cliente" para una
 * orden en estado listo_entrega. Presenta:
 * 1. Resumen del servicio (dispositivo, trabajo, total)
 * 2. Mensaje profesional y cálido de bienvenida al recoger
 * 3. Invitación a promociones actuales
 * 4. Botón directo a WhatsApp (con mensaje prellenado)
 */

import { createPortal } from "react-dom";
import { X, Smartphone, CheckCircle2, Gift, MessageCircle, ExternalLink } from "lucide-react";
import type { OrdenReparacionDetallada } from "@/types";

interface Props {
  orden: OrdenReparacionDetallada;
  onCerrar: () => void;
}

function fmt(n: number) {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ModalNotificarListoEntrega({ orden, onCerrar }: Props) {
  const tel = orden.clienteTelefono?.replace(/\D/g, "") ?? "";
  const saldoPendiente = (orden.costoTotal ?? 0) - (orden.totalAnticipos ?? 0);
  const trabajoRealizado = orden.partesReemplazadas?.length
    ? orden.partesReemplazadas.map((p) => p.parte).join(", ")
    : orden.diagnosticoTecnico ?? orden.problemaReportado ?? "";

  const mensajeWA = [
    `Hola ${orden.clienteNombre} 👋, te contactamos de CREDIPHONE.`,
    ``,
    `✅ Tu ${orden.marcaDispositivo} ${orden.modeloDispositivo} está *listo para recoger*.`,
    trabajoRealizado ? `🔧 Trabajo realizado: ${trabajoRealizado}` : "",
    saldoPendiente > 0 ? `💳 Saldo pendiente: ${fmt(saldoPendiente)}` : `✔ Servicio liquidado.`,
    ``,
    `🎁 Al pasar, pregunta por nuestras promociones actuales en accesorios y equipos.`,
    ``,
    `¡Te esperamos! 😊`,
  ].filter(Boolean).join("\n");

  const waUrl = tel
    ? `https://wa.me/52${tel}?text=${encodeURIComponent(mensajeWA)}`
    : "";

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" style={{ color: "var(--color-success)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Listo para recoger
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Folio {orden.folio}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Resumen del servicio */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {orden.marcaDispositivo} {orden.modeloDispositivo}
              </p>
            </div>
            <div className="text-xs space-y-1" style={{ color: "var(--color-text-secondary)" }}>
              <p><span className="font-semibold">Cliente:</span> {orden.clienteNombre} {orden.clienteApellido ?? ""}</p>
              {trabajoRealizado && (
                <p><span className="font-semibold">Trabajo realizado:</span> {trabajoRealizado}</p>
              )}
              <p><span className="font-semibold">Costo total:</span> {fmt(orden.costoTotal ?? 0)}</p>
              {(orden.totalAnticipos ?? 0) > 0 && (
                <p><span className="font-semibold">Anticipo pagado:</span> {fmt(orden.totalAnticipos!)}</p>
              )}
              <p
                className="font-semibold text-sm"
                style={{ color: saldoPendiente > 0 ? "var(--color-warning-text)" : "var(--color-success-text)" }}
              >
                {saldoPendiente > 0 ? `Saldo pendiente: ${fmt(saldoPendiente)}` : "Servicio liquidado ✔"}
              </p>
            </div>
          </div>

          {/* Mensaje al cliente */}
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--color-bg-sunken)", border: "1px solid var(--color-border-subtle)" }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              Vista previa del mensaje
            </p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-text-primary)", lineHeight: 1.6 }}>
              {mensajeWA}
            </p>
          </div>

          {/* Recordatorio de promociones */}
          <div
            className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: "var(--color-accent-light)", border: "1px solid var(--color-accent)33" }}
          >
            <Gift className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--color-accent)" }} />
            <p className="text-xs" style={{ color: "var(--color-accent)" }}>
              Recuerda mencionar las <strong>promociones actuales</strong> de accesorios,
              fundas, cargadores y equipos cuando el cliente pase a recoger.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm font-medium rounded-lg"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            Cerrar
          </button>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg"
              style={{ background: "#25d366", color: "#fff" }}
              onClick={onCerrar}
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
