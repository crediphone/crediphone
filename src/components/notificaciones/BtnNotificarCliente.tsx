"use client";

/**
 * FASE 45 — BtnNotificarCliente
 *
 * Botón reutilizable que:
 * 1. Carga la plantilla del tipo indicado
 * 2. Sustituye las variables con los datos del cliente/crédito/reparación
 * 3. Abre un modal con preview editable del mensaje
 * 4. Al confirmar, abre wa.me en nueva pestaña y registra en historial
 *
 * Compatible con créditos y reparaciones.
 */

import React, { useState, useCallback } from "react";
import { MessageSquare, Send, X, Edit3, RefreshCw, ExternalLink } from "lucide-react";
import type { VarsPlantilla } from "@/lib/plantillas-notificacion";
import { generarWaLink, renderMensaje } from "@/lib/plantillas-notificacion";

interface BtnNotificarClienteProps {
  /** Tipo de plantilla (ej: 'recordatorio_pago', 'reparacion_lista_entrega') */
  tipo: string;
  /** Teléfono del cliente (con o sin código de país) */
  telefono: string;
  /** Variables para sustituir en la plantilla */
  vars: VarsPlantilla;
  /** Label del botón — default: "Notificar por WhatsApp" */
  label?: string;
  /** Tamaño: 'sm' | 'md' */
  size?: "sm" | "md";
  /** Variant visual */
  variant?: "primary" | "ghost" | "outline";
  /** Callback después de enviar */
  onEnviado?: () => void;
  /** Clase CSS adicional */
  className?: string;
}

interface PlantillaData {
  mensaje: string;
  nombre: string;
}

export function BtnNotificarCliente({
  tipo,
  telefono,
  vars,
  label = "Notificar por WhatsApp",
  size = "md",
  variant = "primary",
  onEnviado,
  className = "",
}: BtnNotificarClienteProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [plantilla, setPlantilla] = useState<PlantillaData | null>(null);
  const [mensajeEditado, setMensajeEditado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(false);

  const abrirModal = useCallback(async () => {
    if (!telefono) {
      alert("Este cliente no tiene número de teléfono registrado.");
      return;
    }

    setCargando(true);
    setModalOpen(true);

    try {
      const res = await fetch(`/api/plantillas-notificacion`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const p = data.data.find((pl: { tipo: string; activa: boolean }) => pl.tipo === tipo && pl.activa);
        if (p) {
          const mensajeRenderizado = renderMensaje(p.mensaje, vars);
          setPlantilla({ mensaje: p.mensaje, nombre: p.nombre });
          setMensajeEditado(mensajeRenderizado);
        } else {
          // Plantilla no encontrada — construir mensaje genérico
          const fallback = `Hola ${vars.nombre || "cliente"}, te contactamos de parte de ${vars.empresa || "CREDIPHONE"}.`;
          setPlantilla({ mensaje: fallback, nombre: "Mensaje general" });
          setMensajeEditado(fallback);
        }
      }
    } catch {
      const fallback = `Hola ${vars.nombre || "cliente"}, te contactamos.`;
      setPlantilla({ mensaje: fallback, nombre: "Mensaje" });
      setMensajeEditado(fallback);
    } finally {
      setCargando(false);
    }
  }, [tipo, vars, telefono]);

  const handleEnviar = useCallback(async () => {
    if (!mensajeEditado.trim() || !telefono) return;

    setEnviando(true);
    try {
      const waLink = generarWaLink(telefono, mensajeEditado);
      window.open(waLink, "_blank");

      // Registrar en historial (fire-and-forget)
      fetch("/api/notificaciones/historial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          telefono,
          mensaje: mensajeEditado,
          canal: "whatsapp",
          vars,
        }),
      }).catch(() => {});

      setModalOpen(false);
      onEnviado?.();
    } finally {
      setEnviando(false);
    }
  }, [mensajeEditado, telefono, tipo, vars, onEnviado]);

  const resetearMensaje = useCallback(() => {
    if (plantilla) {
      setMensajeEditado(renderMensaje(plantilla.mensaje, vars));
    }
  }, [plantilla, vars]);

  // Estilos según variant y size
  const btnPadding = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const btnStyle: React.CSSProperties =
    variant === "primary"
      ? { background: "var(--color-accent)", color: "white", border: "none" }
      : variant === "outline"
      ? { background: "transparent", color: "var(--color-accent)", border: "1px solid var(--color-accent)" }
      : { background: "var(--color-accent-light)", color: "var(--color-accent)", border: "1px solid transparent" };

  return (
    <>
      {/* Botón disparador */}
      <button
        className={`inline-flex items-center gap-1.5 font-medium rounded-lg ${btnPadding} ${className}`}
        style={{ ...btnStyle, transition: "opacity 180ms" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
        onClick={abrirModal}
        title={!telefono ? "Sin número de teléfono" : label}
        disabled={!telefono}
      >
        <MessageSquare className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        {label}
      </button>

      {/* Modal de preview / edición */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
          >
            {/* Header modal */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {cargando ? "Cargando plantilla…" : (plantilla?.nombre ?? "Notificación WhatsApp")}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Para: {telefono}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg"
                style={{ color: "var(--color-text-muted)", transition: "background 150ms" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {cargando ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-4 rounded" style={{ background: "var(--color-bg-elevated)", width: `${70 + i * 5}%` }} />
                  ))}
                </div>
              ) : (
                <>
                  {/* Toolbar edición */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      {editando ? "Editando mensaje" : "Preview del mensaje"}
                    </p>
                    <div className="flex items-center gap-2">
                      {editando && (
                        <button
                          onClick={resetearMensaje}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                          style={{ color: "var(--color-text-muted)", background: "var(--color-bg-elevated)" }}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Restaurar
                        </button>
                      )}
                      <button
                        onClick={() => setEditando(!editando)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                        style={{
                          color: editando ? "var(--color-accent)" : "var(--color-text-secondary)",
                          background: editando ? "var(--color-accent-light)" : "var(--color-bg-elevated)",
                        }}
                      >
                        <Edit3 className="w-3 h-3" />
                        {editando ? "Viendo preview" : "Editar"}
                      </button>
                    </div>
                  </div>

                  {editando ? (
                    <textarea
                      className="w-full rounded-xl p-3 text-sm resize-none"
                      style={{
                        background: "var(--color-bg-sunken)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-primary)",
                        fontFamily: "var(--font-ui)",
                        minHeight: 200,
                        outline: "none",
                      }}
                      value={mensajeEditado}
                      onChange={(e) => setMensajeEditado(e.target.value)}
                    />
                  ) : (
                    <div
                      className="rounded-xl p-4 text-sm"
                      style={{
                        background: "var(--color-bg-sunken)",
                        border: "1px solid var(--color-border-subtle)",
                        color: "var(--color-text-primary)",
                        whiteSpace: "pre-wrap",
                        fontFamily: "var(--font-ui)",
                        maxHeight: 260,
                        overflowY: "auto",
                      }}
                    >
                      {mensajeEditado}
                    </div>
                  )}

                  {/* Info WhatsApp */}
                  <div
                    className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
                    style={{ background: "var(--color-accent-light)", border: "1px solid var(--color-accent)33" }}
                  >
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--color-accent)" }} />
                    <p className="text-xs" style={{ color: "var(--color-accent)" }}>
                      Se abrirá WhatsApp con el mensaje listo. Solo toca <strong>Enviar</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 px-5 py-4"
              style={{ borderTop: "1px solid var(--color-border-subtle)" }}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg"
                style={{
                  background: "var(--color-bg-elevated)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                disabled={enviando || cargando || !mensajeEditado.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg"
                style={{
                  background: enviando ? "var(--color-accent-hover)" : "var(--color-accent)",
                  color: "white",
                  opacity: (enviando || cargando || !mensajeEditado.trim()) ? 0.6 : 1,
                  transition: "opacity 180ms",
                }}
              >
                <Send className="w-4 h-4" />
                {enviando ? "Abriendo…" : "Abrir WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
