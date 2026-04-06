"use client";

/**
 * FASE 56: Modal de confirmación de WhatsApp al cambiar estado.
 * Muestra preview del mensaje que se enviará al cliente y permite
 * enviarlo o saltarlo. El estado ya cambió en BD — esto es notificación opcional.
 */

import { useState, useEffect } from "react";
import { Send, SkipForward, Phone, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { EstadoOrdenReparacion, OrdenReparacionDetallada } from "@/types";

// ─── Plantillas de mensaje por estado ────────────────────────────────────────

function generarMensaje(
  orden: OrdenReparacionDetallada,
  nuevoEstado: EstadoOrdenReparacion,
  notas?: string
): string | null {
  const nombre = orden.clienteNombre;
  const equipo = `${orden.marcaDispositivo} ${orden.modeloDispositivo}`.trim();
  const folio = orden.folio;
  const nota = notas ? `\n\n📝 Nota: ${notas}` : "";

  switch (nuevoEstado) {
    case "diagnostico":
      return `Hola ${nombre} 👋\n\nHemos comenzado el *diagnóstico* de tu ${equipo} (${folio}).\n\nTe avisaremos en cuanto tengamos el resultado.${nota}`;

    case "presupuesto":
      return `Hola ${nombre} 👋\n\nEl diagnóstico de tu ${equipo} está listo. Te enviamos el *presupuesto* para tu revisión y aprobación (${folio}).\n\nPor favor confírmanos si deseas proceder con la reparación.${nota}`;

    case "aprobado":
      return `Hola ${nombre} ✅\n\nHemos registrado tu *aprobación* del presupuesto para tu ${equipo} (${folio}).\n\nProcedremos con la reparación a la brevedad.${nota}`;

    case "esperando_piezas":
      return `Hola ${nombre} ⏳\n\nTu ${equipo} está *en espera de piezas* (${folio}).\n\nTe notificaremos cuando lleguen y podamos continuar la reparación.${nota}`;

    case "en_reparacion":
      return `Hola ${nombre} 🔧\n\nTu ${equipo} está *en reparación* en este momento (${folio}).\n\nTe avisaremos cuando esté listo.${nota}`;

    case "completado":
    case "listo_entrega":
      return `Hola ${nombre} ✨\n\nTu ${equipo} ya está *listo para entrega* (${folio}).\n\nPuedes pasar a recogerlo en el horario de atención. 🙌${nota}`;

    case "entregado":
      return `Hola ${nombre} 🎉\n\n¡Tu ${equipo} ha sido *entregado* exitosamente (${folio})!\n\nGracias por confiar en nosotros. Si tienes alguna duda, con gusto te ayudamos.${nota}`;

    case "no_reparable":
      return `Hola ${nombre} 😔\n\nLamentamos informarte que tu ${equipo} *no pudo ser reparado* (${folio}).\n\nPuedes pasar a recoger tu equipo. Te explicamos los detalles.${nota}`;

    case "cancelado":
      return `Hola ${nombre}\n\nTu orden de servicio para el ${equipo} (${folio}) ha sido *cancelada*.\n\nPuedes pasar a recoger tu equipo. Disculpa los inconvenientes.${nota}`;

    default:
      return null;
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface ModalWhatsAppEstadoProps {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenReparacionDetallada;
  nuevoEstado: EstadoOrdenReparacion;
  notas?: string;
}

const estadoLabels: Record<EstadoOrdenReparacion, string> = {
  recibido: "Recibido",
  diagnostico: "En Diagnóstico",
  esperando_piezas: "En espera de piezas",
  presupuesto: "Presupuesto enviado",
  aprobado: "Aprobado",
  en_reparacion: "En Reparación",
  completado: "Completado",
  listo_entrega: "Listo para entrega",
  entregado: "Entregado",
  no_reparable: "No reparable",
  cancelado: "Cancelado",
};

export function ModalWhatsAppEstado({
  isOpen,
  onClose,
  orden,
  nuevoEstado,
  notas,
}: ModalWhatsAppEstadoProps) {
  const [mensajeEditado, setMensajeEditado] = useState<string>("");
  const [iniciado, setIniciado] = useState(false);

  const mensajeBase = generarMensaje(orden, nuevoEstado, notas) ?? "";

  // Si se abre el modal para un estado sin plantilla de WA, cerrar automáticamente.
  // Se hace en useEffect (nunca durante render) para no violar las reglas de React.
  useEffect(() => {
    if (isOpen && !mensajeBase) {
      onClose();
    }
  }, [isOpen, mensajeBase, onClose]);

  // Resetear estado interno cuando el modal se cierra
  useEffect(() => {
    if (!isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setIniciado(false);
      setMensajeEditado("");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen]);

  const mensajeFinal = iniciado ? mensajeEditado : mensajeBase;

  function handleOpen() {
    if (!iniciado) {
      setMensajeEditado(mensajeBase);
      setIniciado(true);
    }
  }

  function handleEnviar() {
    const tel = orden.clienteTelefono.replace(/\D/g, "");
    const numero = tel.startsWith("52") ? tel : `52${tel}`;
    const texto = encodeURIComponent(mensajeFinal || mensajeBase);
    window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
    onClose();
  }

  // Retorno temprano DESPUÉS de todos los hooks (nunca antes).
  // No llamar setState aquí — solo retornar null es seguro.
  if (!isOpen || !mensajeBase) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notificar al cliente por WhatsApp"
      size="md"
    >
      <div className="space-y-4">

        {/* Receptor */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-success-bg)" }}
          >
            <MessageCircle className="w-4 h-4" style={{ color: "var(--color-success)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
              {orden.clienteNombre}
            </p>
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
              <Phone className="w-3 h-3" />
              {orden.clienteTelefono}
            </p>
          </div>
          <div
            className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
            style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
          >
            {estadoLabels[nuevoEstado]}
          </div>
        </div>

        {/* Vista previa del mensaje */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Mensaje
            </p>
            {!iniciado && (
              <button
                onClick={handleOpen}
                className="text-xs underline"
                style={{ color: "var(--color-accent)" }}
              >
                Editar
              </button>
            )}
          </div>

          {iniciado ? (
            <textarea
              rows={7}
              value={mensajeEditado}
              onChange={(e) => setMensajeEditado(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none leading-relaxed"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-border-strong)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            />
          ) : (
            <div
              className="rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap cursor-pointer"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-border-subtle)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-ui)",
              }}
              onClick={handleOpen}
              title="Click para editar"
            >
              {mensajeBase}
            </div>
          )}
        </div>

        {/* Aviso */}
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Al enviar, se abrirá WhatsApp con el mensaje listo. Verifica y pulsa Enviar en la app.
        </p>

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all"
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-sunken)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-bg-elevated)")}
          >
            <SkipForward className="w-4 h-4" />
            Omitir
          </button>
          <button
            onClick={handleEnviar}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all"
            style={{ background: "var(--color-success)", color: "#fff" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Send className="w-4 h-4" />
            Enviar por WhatsApp
          </button>
        </div>
      </div>
    </Modal>
  );
}
