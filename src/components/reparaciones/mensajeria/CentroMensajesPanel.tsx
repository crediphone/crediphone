"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { OrdenReparacionDetallada } from "@/types";
import {
  MessageCircle,
  Package,
  Clock,
  Tag,
  Gift,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Info,
  Bell,
  BellOff,
} from "lucide-react";
import {
  generarMensajePiezaFaltante,
  generarMensajePiezaEnEspera,
  generarMensajeDescuentoRapido,
  generarMensajeAvisoAlmacenaje,
  generarMensajePromocion,
  generarLinkWhatsApp,
} from "@/lib/whatsapp-reparaciones";

// Suppress unused import warnings — these are kept for forward compatibility
void Package; void Clock; void Tag;

interface CentroMensajesPanelProps {
  orden: OrdenReparacionDetallada;
  onUpdate: () => void;
}

interface ClienteConsentimiento {
  acepta_notificaciones_whatsapp: boolean;
  acepta_promociones_whatsapp: boolean;
  preferencias_promociones: {
    accesorios?: boolean;
    combos?: boolean;
    celulares?: boolean;
  };
}

interface NotificacionHistorial {
  id: string;
  tipo: string;
  canal: string;
  estado: string;
  mensaje: string;
  telefono?: string;
  fecha_enviado?: string;
  created_at: string;
  datos_adicionales?: Record<string, unknown>;
}

// ── Color token map for TarjetaMensaje ────────────────────────
type TarjetaColor = "info" | "warning" | "danger" | "success" | "accent";

const TARJETA_TOKENS: Record<TarjetaColor, { border: string; header: string }> = {
  info:    { border: "var(--color-info)",    header: "var(--color-info-bg)" },
  warning: { border: "var(--color-warning)", header: "var(--color-warning-bg)" },
  danger:  { border: "var(--color-danger)",  header: "var(--color-danger-bg)" },
  success: { border: "var(--color-success)", header: "var(--color-success-bg)" },
  accent:  { border: "var(--color-accent)",  header: "var(--color-accent-light)" },
};

const mapColor = (color?: "blue" | "orange" | "red" | "green" | "purple"): TarjetaColor => {
  const map: Record<string, TarjetaColor> = {
    blue: "info", orange: "warning", red: "danger", green: "success", purple: "accent",
  };
  return (map[color || "blue"] as TarjetaColor) || "info";
};

// ── abrirYRegistrarWhatsApp ────────────────────────────────────
function abrirYRegistrarWhatsApp(
  telefono: string,
  mensaje: string,
  tipo: string,
  ordenId: string,
  clienteId: string | undefined,
  onRegistrado: () => void
) {
  const link = generarLinkWhatsApp(telefono, mensaje);
  window.open(link, "_blank");
  fetch(`/api/reparaciones/${ordenId}/notificaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clienteId: clienteId || null,
      tipo,
      canal: "whatsapp",
      estado: "enviado",
      mensaje,
      telefono,
      datosAdicionales: { origen: "envio_manual_panel", tipo_mensaje: tipo },
    }),
  })
    .then(() => onRegistrado())
    .catch(() => onRegistrado());
}

// ── TarjetaMensaje ─────────────────────────────────────────────
function TarjetaMensaje({
  icono,
  titulo,
  descripcion,
  mensaje,
  telefono,
  tipo,
  ordenId,
  clienteId,
  visible,
  color,
  children,
  onEnviado,
}: {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  mensaje: string;
  telefono: string;
  tipo: string;
  ordenId: string;
  clienteId?: string;
  visible?: boolean;
  color?: "blue" | "orange" | "red" | "green" | "purple";
  children?: React.ReactNode;
  onEnviado: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (visible === false) return null;

  const tokens = TARJETA_TOKENS[mapColor(color)];

  const handleEnviar = () => {
    setEnviando(true);
    abrirYRegistrarWhatsApp(telefono, mensaje, tipo, ordenId, clienteId, () => {
      setEnviando(false);
      onEnviado();
    });
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${tokens.border}` }}
    >
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full flex items-center justify-between p-4 text-left transition-all"
        style={{
          background: tokens.header,
          filter: hovered ? "brightness(0.95)" : "none",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icono}</div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
              {titulo}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {descripcion}
            </p>
          </div>
        </div>
        {abierto ? (
          <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
        )}
      </button>

      {abierto && (
        <div
          className="p-4 space-y-4"
          style={{
            background: "var(--color-bg-surface)",
            borderTop: `1px solid ${tokens.border}`,
          }}
        >
          {children}

          <div>
            <p
              className="text-xs font-medium mb-2 uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
              Vista previa del mensaje
            </p>
            <pre
              className="text-xs rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto"
              style={{
                color: "var(--color-text-secondary)",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
              }}
            >
              {mensaje}
            </pre>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleEnviar}
              disabled={enviando || !telefono}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ background: "#25D366" }}
              onMouseEnter={(e) => { if (!enviando) e.currentTarget.style.background = "#1ebe5c"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#25D366"; }}
            >
              {enviando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              Abrir WhatsApp
            </button>
            {!telefono && (
              <span className="text-xs" style={{ color: "var(--color-danger)" }}>
                Sin número de teléfono
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── HistorialRow ───────────────────────────────────────────────
function HistorialRow({ notif }: { notif: NotificacionHistorial }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--color-bg-elevated)" : "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        transition: "background 150ms",
      }}
    >
      <MessageCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#25D366" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            {labelTipo(notif.tipo)}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {notif.fecha_enviado
              ? new Date(notif.fecha_enviado).toLocaleString("es-MX", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })
              : new Date(notif.created_at).toLocaleString("es-MX", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
          </span>
        </div>
        {notif.telefono && (
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
          >
            {notif.telefono}
          </p>
        )}
      </div>
      <span
        className="text-xs px-2 py-0.5 rounded-full shrink-0"
        style={
          notif.estado === "enviado"
            ? { background: "var(--color-success-bg)", color: "var(--color-success-text)" }
            : { background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }
        }
      >
        {notif.estado}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export function CentroMensajesPanel({ orden, onUpdate }: CentroMensajesPanelProps) {
  const [consentimiento, setConsentimiento] = useState<ClienteConsentimiento>({
    acepta_notificaciones_whatsapp: true,
    acepta_promociones_whatsapp: false,
    preferencias_promociones: { accesorios: true, combos: true, celulares: true },
  });
  const [loadingCliente, setLoadingCliente] = useState(true);
  const [actualizandoConsent, setActualizandoConsent] = useState(false);

  const [historial, setHistorial] = useState<NotificacionHistorial[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  const [aprobando, setAprobando] = useState(false);
  const [rechazando, setRechazando] = useState(false);

  const [descuentoPct, setDescuentoPct] = useState(10);
  const [descuentoDias, setDescuentoDias] = useState(3);

  const telefono = orden.clienteTelefono || "";
  const clienteId = orden.clienteId;

  const diasDesdeListoEntrega = (() => {
    if (orden.estado !== "listo_entrega") return 0;
    const fechaRef = orden.fechaCompletado || orden.fechaRecepcion;
    if (!fechaRef) return 0;
    const diff = Date.now() - new Date(fechaRef).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  })();

  const fechaLimiteDescuento = new Date();
  fechaLimiteDescuento.setDate(fechaLimiteDescuento.getDate() + descuentoDias);

  const fetchCliente = useCallback(async () => {
    if (!clienteId) { setLoadingCliente(false); return; }
    try {
      const res = await fetch(`/api/clientes/${clienteId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const c = data.data;
        setConsentimiento({
          acepta_notificaciones_whatsapp: c.acepta_notificaciones_whatsapp ?? true,
          acepta_promociones_whatsapp: c.acepta_promociones_whatsapp ?? false,
          preferencias_promociones: c.preferencias_promociones ?? { accesorios: true, combos: true, celulares: true },
        });
      }
    } catch { /* silencioso */ } finally {
      setLoadingCliente(false);
    }
  }, [clienteId]);

  const fetchHistorial = useCallback(async () => {
    try {
      setLoadingHistorial(true);
      const res = await fetch(`/api/reparaciones/${orden.id}/notificaciones`);
      const data = await res.json();
      if (data.success) {
        const todasWA = (data.data || []).filter(
          (n: NotificacionHistorial) => n.canal === "whatsapp"
        );
        setHistorial(todasWA);
      }
    } catch { /* silencioso */ } finally {
      setLoadingHistorial(false);
    }
  }, [orden.id]);

  useEffect(() => {
    fetchCliente();
    fetchHistorial();
  }, [fetchCliente, fetchHistorial]);

  const handleToggleConsent = async (
    campo: keyof Omit<ClienteConsentimiento, "preferencias_promociones">,
    valor: boolean
  ) => {
    if (!clienteId) return;
    setActualizandoConsent(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [campo]: valor, fecha_consentimiento: new Date().toISOString() }),
      });
      if (res.ok) setConsentimiento((prev) => ({ ...prev, [campo]: valor }));
    } catch { /* silencioso */ } finally {
      setActualizandoConsent(false);
    }
  };

  const handleTogglePreferencia = async (
    tipo: keyof ClienteConsentimiento["preferencias_promociones"],
    valor: boolean
  ) => {
    if (!clienteId) return;
    const nuevasPrefs = { ...consentimiento.preferencias_promociones, [tipo]: valor };
    setActualizandoConsent(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferencias_promociones: nuevasPrefs }),
      });
      if (res.ok) {
        setConsentimiento((prev) => ({ ...prev, preferencias_promociones: nuevasPrefs }));
      }
    } catch { /* silencioso */ } finally {
      setActualizandoConsent(false);
    }
  };

  const handleRegistrarAprobacion = async () => {
    if (!confirm("¿Confirmar que el cliente aprobó el presupuesto por WhatsApp?")) return;
    setAprobando(true);
    try {
      const res = await fetch(`/api/reparaciones/${orden.id}/aprobar-presupuesto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notasCliente: "Aprobado por el cliente vía WhatsApp" }),
      });
      const data = await res.json();
      if (data.success) { onUpdate(); }
      else { alert("Error: " + (data.message || data.error)); }
    } catch {
      alert("Error al registrar aprobación");
    } finally {
      setAprobando(false);
    }
  };

  const handleRegistrarRechazo = async () => {
    if (!confirm("¿Confirmar que el cliente rechazó el presupuesto por WhatsApp? Esto cancelará la orden.")) return;
    setRechazando(true);
    try {
      const res = await fetch(`/api/reparaciones/${orden.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "cancelado",
          notasInternas: "Presupuesto rechazado por el cliente vía WhatsApp",
        }),
      });
      const data = await res.json();
      if (data.success) { onUpdate(); }
      else { alert("Error: " + (data.message || data.error)); }
    } catch {
      alert("Error al registrar rechazo");
    } finally {
      setRechazando(false);
    }
  };

  const msgPiezaFaltante  = generarMensajePiezaFaltante(orden);
  const msgPiezaEnEspera  = generarMensajePiezaEnEspera(orden);
  const msgDescuento      = generarMensajeDescuentoRapido(orden, descuentoPct, fechaLimiteDescuento);
  const msgAlmacenaje     = generarMensajeAvisoAlmacenaje(orden, diasDesdeListoEntrega || 30);
  const msgPromoAccesorio = generarMensajePromocion(orden, "accesorio");
  const msgPromoCombo     = generarMensajePromocion(orden, "combo");
  const msgPromoCelular   = generarMensajePromocion(orden, "celular");

  const mostrarPromos = consentimiento.acepta_promociones_whatsapp;
  const prefs = consentimiento.preferencias_promociones;
  const afterSend = () => fetchHistorial();

  const inputSt: React.CSSProperties = {
    width: "100%",
    fontSize: "0.875rem",
    borderRadius: "0.25rem",
    border: "1px solid var(--color-border)",
    padding: "0.25rem 0.5rem",
    background: "var(--color-bg-surface)",
    color: "var(--color-text-primary)",
    outline: "none",
  };

  return (
    <div className="space-y-6">
      {/* ── A. Consentimiento del Cliente ──────────────────────────── */}
      <Card title="Preferencias del Cliente">
        {loadingCliente ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando preferencias...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle notificaciones */}
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ border: "1px solid var(--color-border)", background: "var(--color-bg-elevated)" }}
              >
                <div className="flex items-center gap-2">
                  {consentimiento.acepta_notificaciones_whatsapp ? (
                    <Bell className="w-4 h-4" style={{ color: "var(--color-success)" }} />
                  ) : (
                    <BellOff className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                  )}
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      Notificaciones WhatsApp
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Avisos de servicio</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={actualizandoConsent}
                  onClick={() =>
                    handleToggleConsent(
                      "acepta_notificaciones_whatsapp",
                      !consentimiento.acepta_notificaciones_whatsapp
                    )
                  }
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
                  style={{
                    background: consentimiento.acepta_notificaciones_whatsapp
                      ? "var(--color-success)"
                      : "var(--color-border)",
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                    style={{
                      transform: consentimiento.acepta_notificaciones_whatsapp
                        ? "translateX(1.5rem)"
                        : "translateX(0.25rem)",
                    }}
                  />
                </button>
              </div>

              {/* Toggle promociones */}
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ border: "1px solid var(--color-border)", background: "var(--color-bg-elevated)" }}
              >
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      Promociones WhatsApp
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Ofertas y combos</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={actualizandoConsent}
                  onClick={() =>
                    handleToggleConsent(
                      "acepta_promociones_whatsapp",
                      !consentimiento.acepta_promociones_whatsapp
                    )
                  }
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
                  style={{
                    background: consentimiento.acepta_promociones_whatsapp
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                    style={{
                      transform: consentimiento.acepta_promociones_whatsapp
                        ? "translateX(1.5rem)"
                        : "translateX(0.25rem)",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Sub-preferencias */}
            {consentimiento.acepta_promociones_whatsapp && (
              <div className="pl-2 pt-1">
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
                  Tipos de promociones que acepta recibir:
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: "accesorios", label: "Accesorios" },
                      { key: "combos", label: "Combos" },
                      { key: "celulares", label: "Celulares" },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      disabled={actualizandoConsent}
                      onClick={() => handleTogglePreferencia(key, !prefs[key])}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                      style={{
                        background: prefs[key] ? "var(--color-accent-light)" : "var(--color-bg-elevated)",
                        color: prefs[key] ? "var(--color-accent)" : "var(--color-text-muted)",
                        border: `1px solid ${prefs[key] ? "var(--color-accent)" : "var(--color-border)"}`,
                      }}
                    >
                      {prefs[key] ? "✓ " : ""}{label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
              <Info className="w-3 h-3" />
              Cumplimiento LFPDPPP. El cliente puede cambiar sus preferencias en cualquier momento.
            </p>
          </div>
        )}
      </Card>

      {/* ── B. Mensajes automáticos ────────────────────────────────── */}
      <Card title="Mensajes Automáticos de Estado">
        <div
          className="p-3 rounded-lg"
          style={{ background: "var(--color-info-bg)", border: "1px solid var(--color-info)" }}
        >
          <div className="flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-info)" }} />
            <div className="text-sm" style={{ color: "var(--color-info-text)" }}>
              Los siguientes mensajes se envían <strong>automáticamente</strong> cuando se actualiza el estado de la orden:
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
          {[
            { estado: "presupuesto",   label: "Presupuesto enviado" },
            { estado: "en_reparacion", label: "En reparación" },
            { estado: "listo_entrega", label: "Listo para recoger" },
            { estado: "entregado",     label: "Entregado" },
            { estado: "no_reparable",  label: "No reparable" },
            { estado: "cancelado",     label: "Cancelado" },
          ].map(({ estado, label }) => (
            <div
              key={estado}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
            >
              <MessageCircle className="w-3 h-3 shrink-0" style={{ color: "var(--color-success)" }} />
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── D. Registro de respuesta del cliente ──────────────────── */}
      {orden.estado === "presupuesto" && (
        <Card title="Registrar Respuesta del Cliente">
          <div
            className="p-3 mb-4 rounded-lg"
            style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)" }}
          >
            <div className="flex gap-2 text-sm" style={{ color: "var(--color-warning-text)" }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Usa estos botones si el cliente respondió <strong>por WhatsApp</strong> en lugar de usar el link de seguimiento.
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={handleRegistrarAprobacion} disabled={aprobando || rechazando}>
              {aprobando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Registrar Aprobación
            </Button>
            <Button variant="danger" onClick={handleRegistrarRechazo} disabled={aprobando || rechazando}>
              {rechazando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Registrar Rechazo
            </Button>
          </div>
        </Card>
      )}

      {/* ── C. Mensajes manuales ───────────────────────────────────── */}
      <Card title="Mensajes Manuales">
        <div className="space-y-3">
          <div className="mb-1">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>
              📦 Piezas y Esperas
            </p>
          </div>

          <TarjetaMensaje
            icono="📦" titulo="Pieza No Disponible"
            descripcion="Informa que la pieza necesaria no está en stock"
            mensaje={msgPiezaFaltante} telefono={telefono} tipo="pieza_faltante"
            ordenId={orden.id} clienteId={clienteId} color="orange" onEnviado={afterSend}
          />

          <TarjetaMensaje
            icono="⏳" titulo="Pieza en Espera / Retraso"
            descripcion="La pieza fue pedida pero tarda más de lo esperado"
            mensaje={msgPiezaEnEspera} telefono={telefono} tipo="pieza_en_espera"
            ordenId={orden.id} clienteId={clienteId} color="orange" onEnviado={afterSend}
          />

          <div className="mt-4 mb-1">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>
              ⏰ Almacenaje y Recogida
            </p>
          </div>

          <TarjetaMensaje
            icono="🎁" titulo="Descuento por Recogida Rápida"
            descripcion="Ofrece un descuento si el cliente recoge antes de una fecha"
            mensaje={msgDescuento} telefono={telefono} tipo="descuento_rapido"
            ordenId={orden.id} clienteId={clienteId}
            visible={orden.estado === "listo_entrega"} color="green" onEnviado={afterSend}
          >
            <div
              className="grid grid-cols-2 gap-3 p-3 rounded-lg"
              style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)" }}
            >
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Descuento (%)
                </label>
                <input
                  type="number" min={1} max={50} value={descuentoPct}
                  onChange={(e) => setDescuentoPct(Number(e.target.value))}
                  style={inputSt}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Días límite
                </label>
                <input
                  type="number" min={1} max={30} value={descuentoDias}
                  onChange={(e) => setDescuentoDias(Number(e.target.value))}
                  style={inputSt}
                />
              </div>
            </div>
          </TarjetaMensaje>

          <TarjetaMensaje
            icono="⚠️" titulo="Aviso de Cobro por Almacenaje"
            descripcion={`Equipo sin recoger ${diasDesdeListoEntrega > 0 ? `(${diasDesdeListoEntrega} días)` : "más de 30 días"}`}
            mensaje={msgAlmacenaje} telefono={telefono} tipo="aviso_almacenaje"
            ordenId={orden.id} clienteId={clienteId}
            visible={orden.estado === "listo_entrega" && diasDesdeListoEntrega >= 25}
            color="red" onEnviado={afterSend}
          />

          {mostrarPromos && (
            <>
              <div className="mt-4 mb-1">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--color-text-muted)" }}>
                  🎁 Promociones (cliente aceptó recibirlas)
                </p>
              </div>
              {prefs.accesorios !== false && (
                <TarjetaMensaje
                  icono="🛡️" titulo="Promo: Accesorios"
                  descripcion="Fundas, cristales, cargadores para su dispositivo"
                  mensaje={msgPromoAccesorio} telefono={telefono} tipo="promo_accesorio"
                  ordenId={orden.id} clienteId={clienteId} color="purple" onEnviado={afterSend}
                />
              )}
              {prefs.combos !== false && (
                <TarjetaMensaje
                  icono="📦" titulo="Promo: Combo Especial"
                  descripcion="Combo de accesorios a precio especial"
                  mensaje={msgPromoCombo} telefono={telefono} tipo="promo_combo"
                  ordenId={orden.id} clienteId={clienteId} color="purple" onEnviado={afterSend}
                />
              )}
              {prefs.celulares !== false && (
                <TarjetaMensaje
                  icono="📱" titulo="Promo: Renovación de Equipo"
                  descripcion="Oferta para cambiar o adquirir un nuevo equipo"
                  mensaje={msgPromoCelular} telefono={telefono} tipo="promo_celular"
                  ordenId={orden.id} clienteId={clienteId} color="purple" onEnviado={afterSend}
                />
              )}
            </>
          )}

          {!mostrarPromos && (
            <div
              className="mt-2 p-3 rounded-lg"
              style={{ background: "var(--color-bg-elevated)", border: "1px dashed var(--color-border)" }}
            >
              <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                El cliente no acepta mensajes promocionales. Activa el consentimiento arriba para desbloquear.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* ── E. Historial de WhatsApp enviados ─────────────────────── */}
      <Card title={`Historial WhatsApp (${loadingHistorial ? "…" : historial.length})`}>
        {loadingHistorial ? (
          <div className="flex items-center gap-2 text-sm py-4" style={{ color: "var(--color-text-muted)" }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando historial...
          </div>
        ) : historial.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-border)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No hay mensajes WhatsApp registrados aún
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {historial.map((notif) => (
              <HistorialRow key={notif.id} notif={notif} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── labelTipo ──────────────────────────────────────────────────
function labelTipo(tipo: string): string {
  const labels: Record<string, string> = {
    pieza_faltante:  "📦 Pieza no disponible",
    pieza_en_espera: "⏳ Pieza en espera",
    descuento_rapido:"🎁 Descuento por recogida rápida",
    aviso_almacenaje:"⚠️ Aviso almacenaje",
    promo_accesorio: "🛡️ Promo accesorios",
    promo_combo:     "📦 Promo combo",
    promo_celular:   "📱 Promo celular",
    presupuesto:     "💰 Presupuesto",
    seguimiento:     "📊 Seguimiento",
    listo_entrega:   "📦 Listo para recoger",
    completado:      "✅ Completado",
    no_reparable:    "⚠️ No reparable",
    cancelacion:     "❌ Cancelación",
    orden_actualizada:"📋 Actualización",
  };
  return labels[tipo] || tipo;
}
