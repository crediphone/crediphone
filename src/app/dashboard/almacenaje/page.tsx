"use client";

/**
 * Panel de Almacenaje — equipos en listo_entrega sin recoger
 * Muestra días transcurridos, rango de alerta, cobro acumulado y
 * permite enviar recordatorios por WhatsApp con un clic.
 *
 * Marco legal: LFPC Art. 63 / Código de Comercio Art. 373-374
 * Ruta: /dashboard/almacenaje
 */

import { useEffect, useState, useCallback } from "react";
import { Package, MessageCircle, RefreshCw, AlertTriangle, Clock, Phone } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Recordatorio {
  id: string;
  tipo: string;
  diasTranscurridos: number;
  enviadoEn: string;
  canal: string;
}

interface OrdenAlmacenaje {
  id: string;
  folio: string;
  clienteNombre: string;
  clienteTelefono: string;
  tecnicoNombre: string;
  fechaListo: string;
  diasTranscurridos: number;
  rango: "ok" | "aviso_15" | "cobro_30" | "urgente_60" | "disposicion_90";
  cobroPendiente: number;
  tarifaDiaria: number;
  recordatorios: Recordatorio[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const RANGO_CONFIG = {
  ok: {
    label: "< 15 días",
    color: "var(--color-success)",
    bg: "var(--color-success-bg)",
    emoji: "🟢",
    accion: "Sin acción requerida",
  },
  aviso_15: {
    label: "15-29 días",
    color: "var(--color-warning)",
    bg: "var(--color-warning-bg)",
    emoji: "🟡",
    accion: "Enviar primer recordatorio",
  },
  cobro_30: {
    label: "30-59 días",
    color: "#f97316", // orange
    bg: "#fff7ed",
    emoji: "🟠",
    accion: "Enviar aviso de cobro",
  },
  urgente_60: {
    label: "60-89 días",
    color: "var(--color-danger)",
    bg: "var(--color-danger-bg)",
    emoji: "🔴",
    accion: "Aviso urgente — riesgo disposición",
  },
  disposicion_90: {
    label: "90+ días",
    color: "#1e1e1e",
    bg: "#f0f0f0",
    emoji: "⚫",
    accion: "Iniciar proceso de disposición",
  },
};

const TIPO_LABELS: Record<string, string> = {
  recordatorio_15: "Recordatorio inicial",
  recordatorio_25: "Segundo recordatorio",
  aviso_cobro_30: "Aviso de cobro",
  urgente_60: "Aviso urgente",
  disposicion_90: "Aviso disposición",
  manual: "Recordatorio manual",
};

function formatFecha(f: string) {
  return new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function buildWAMessage(orden: OrdenAlmacenaje): string {
  const { folio, clienteNombre, diasTranscurridos, cobroPendiente, tarifaDiaria } = orden;

  if (diasTranscurridos >= 90) {
    return `Estimado/a ${clienteNombre},\n\nTe notificamos que tu equipo con folio *${folio}* lleva *${diasTranscurridos} días* en nuestro establecimiento sin ser recogido.\n\nConforme a nuestros Términos de Servicio (LFPC Art. 63), hemos iniciado el proceso de disposición del equipo para recuperar los costos de almacenaje acumulados ($${cobroPendiente.toFixed(2)}).\n\nPor favor contáctanos a la brevedad para llegar a un acuerdo.\n\n*CREDIPHONE*`;
  }
  if (diasTranscurridos >= 60) {
    return `Estimado/a ${clienteNombre},\n\nTe informamos que tu equipo con folio *${folio}* lleva *${diasTranscurridos} días* en nuestro establecimiento. ⚠️\n\nEl cargo de almacenaje acumulado es de *$${cobroPendiente.toFixed(2)}* (tarifa: $${tarifaDiaria}/día).\n\n⚠️ Si no recoges en los próximos días iniciaremos el proceso de disposición conforme a la LFPC.\n\nContáctanos pronto. *CREDIPHONE*`;
  }
  if (diasTranscurridos >= 30) {
    return `Hola ${clienteNombre} 👋\n\nTu equipo con folio *${folio}* lleva *${diasTranscurridos} días* listo para recoger.\n\nA partir del día 31 se aplica una tarifa de almacenaje de $${tarifaDiaria} MXN por día. El cargo actual es de *$${cobroPendiente.toFixed(2)}*.\n\nPasa a recogerlo a la brevedad para evitar cargos adicionales. 🙏\n\n*CREDIPHONE*`;
  }
  return `Hola ${clienteNombre} 👋\n\nTe recordamos que tu equipo con folio *${folio}* está listo para recoger desde hace *${diasTranscurridos} días*.\n\nTienes hasta el día 30 para recogerlo sin costo adicional de almacenaje. ¡Te esperamos!\n\n*CREDIPHONE*`;
}

function buildWAHref(telefono: string, mensaje: string): string {
  const limpio = telefono.replace(/\D/g, "");
  const num = limpio.startsWith("52") ? limpio : `52${limpio}`;
  return `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`;
}

function tipoParaRango(rango: OrdenAlmacenaje["rango"]): string {
  const map: Record<string, string> = {
    aviso_15: "recordatorio_15",
    cobro_30: "aviso_cobro_30",
    urgente_60: "urgente_60",
    disposicion_90: "disposicion_90",
  };
  return map[rango] ?? "manual";
}

// ── Fila de orden ─────────────────────────────────────────────────────────────

function OrdenRow({ orden, onRecordatorio }: { orden: OrdenAlmacenaje; onRecordatorio: (o: OrdenAlmacenaje) => void }) {
  const [hovered, setHovered] = useState(false);
  const cfg = RANGO_CONFIG[orden.rango];
  const ultimoRecordatorio = orden.recordatorios[0];

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "var(--color-bg-elevated)" : "transparent", transition: "background 0.15s" }}
    >
      {/* Folio */}
      <td className="px-4 py-3 whitespace-nowrap" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        <a
          href={`/dashboard/reparaciones?buscar=${orden.folio}`}
          className="text-sm font-bold"
          style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)", textDecoration: "none" }}
        >
          {orden.folio}
        </a>
      </td>

      {/* Cliente */}
      <td className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{orden.clienteNombre}</p>
        {orden.clienteTelefono && (
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
            <Phone className="w-3 h-3" />
            <span style={{ fontFamily: "var(--font-mono)" }}>{orden.clienteTelefono}</span>
          </p>
        )}
      </td>

      {/* Días */}
      <td className="px-4 py-3 text-center" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div className="inline-flex flex-col items-center gap-1">
          <span
            className="text-2xl font-black"
            style={{ color: cfg.color, fontFamily: "var(--font-mono)", lineHeight: 1 }}
          >
            {orden.diasTranscurridos}
          </span>
          <span className="text-xs" style={{ color: cfg.color }}>días</span>
        </div>
      </td>

      {/* Rango */}
      <td className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}`, whiteSpace: "nowrap" }}
        >
          {cfg.emoji} {cfg.label}
        </div>
      </td>

      {/* Cobro */}
      <td className="px-4 py-3 text-right" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        {orden.cobroPendiente > 0 ? (
          <span className="text-sm font-bold" style={{ color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>
            ${orden.cobroPendiente.toFixed(2)}
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
        )}
      </td>

      {/* Último recordatorio */}
      <td className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        {ultimoRecordatorio ? (
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
              {TIPO_LABELS[ultimoRecordatorio.tipo] ?? ultimoRecordatorio.tipo}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {formatFecha(ultimoRecordatorio.enviadoEn)}
            </p>
          </div>
        ) : (
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Ninguno</span>
        )}
      </td>

      {/* Acción WA */}
      <td className="px-4 py-3 text-right" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
        {orden.clienteTelefono && orden.rango !== "ok" && (
          <button
            onClick={() => onRecordatorio(orden)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "#25D366", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Enviar WA
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Modal de confirmación de WA ───────────────────────────────────────────────

function ModalEnviarWA({
  orden,
  onClose,
  onConfirm,
}: {
  orden: OrdenAlmacenaje;
  onClose: () => void;
  onConfirm: (mensaje: string) => void;
}) {
  const [mensaje, setMensaje] = useState(() => buildWAMessage(orden));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col gap-4 p-6"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)", boxShadow: "var(--shadow-xl, 0 20px 40px rgba(0,0,0,.3))" }}
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5" style={{ color: "#25D366" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
            Recordatorio por WhatsApp — {orden.folio}
          </h2>
        </div>

        <div className="text-sm space-y-1" style={{ color: "var(--color-text-muted)" }}>
          <p>Cliente: <strong style={{ color: "var(--color-text-primary)" }}>{orden.clienteNombre}</strong></p>
          <p>Días sin recoger: <strong style={{ color: RANGO_CONFIG[orden.rango].color }}>{orden.diasTranscurridos} días</strong></p>
          {orden.cobroPendiente > 0 && (
            <p>Cobro acumulado: <strong style={{ color: "var(--color-danger)", fontFamily: "var(--font-mono)" }}>${orden.cobroPendiente.toFixed(2)}</strong></p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Mensaje (editable)
          </label>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={8}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-sunken)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-ui)",
              resize: "vertical",
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(mensaje)}
            className="flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "#25D366", color: "#fff", border: "none", cursor: "pointer" }}
          >
            <MessageCircle className="w-4 h-4" />
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlmacenajePage() {
  const [ordenes, setOrdenes] = useState<OrdenAlmacenaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroRango, setFiltroRango] = useState<string>("todos");
  const [ordenModal, setOrdenModal] = useState<OrdenAlmacenaje | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reparaciones/almacenaje");
      const data = await res.json();
      if (data.success) setOrdenes(data.data);
      else setError(data.error ?? "Error al cargar");
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const ordenesFiltradas = filtroRango === "todos"
    ? ordenes
    : ordenes.filter((o) => o.rango === filtroRango);

  // Conteos por rango
  const conteos = {
    aviso_15: ordenes.filter((o) => o.rango === "aviso_15").length,
    cobro_30: ordenes.filter((o) => o.rango === "cobro_30").length,
    urgente_60: ordenes.filter((o) => o.rango === "urgente_60").length,
    disposicion_90: ordenes.filter((o) => o.rango === "disposicion_90").length,
  };
  const totalCriticas = conteos.cobro_30 + conteos.urgente_60 + conteos.disposicion_90;

  async function handleConfirmarWA(mensaje: string) {
    if (!ordenModal) return;
    setEnviando(true);
    try {
      // Registrar recordatorio en BD
      await fetch("/api/reparaciones/almacenaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ordenId: ordenModal.id,
          tipo: tipoParaRango(ordenModal.rango),
          diasTranscurridos: ordenModal.diasTranscurridos,
          canal: "whatsapp",
          notas: `Enviado desde panel de almacenaje (${ordenModal.diasTranscurridos} días)`,
        }),
      });

      // Abrir WhatsApp
      const href = buildWAHref(ordenModal.clienteTelefono, mensaje);
      window.open(href, "_blank");

      setOrdenModal(null);
      await cargar(); // Refrescar para mostrar el nuevo recordatorio
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Panel de Almacenaje
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Equipos en <em>Listo para Entrega</em> con días sin recoger — LFPC Art. 63
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: loading ? "default" : "pointer" }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["aviso_15", "cobro_30", "urgente_60", "disposicion_90"] as const).map((rango) => {
          const cfg = RANGO_CONFIG[rango];
          const n = conteos[rango];
          const activo = filtroRango === rango;
          return (
            <button
              key={rango}
              onClick={() => setFiltroRango(activo ? "todos" : rango)}
              className="text-left rounded-xl p-4 transition-all"
              style={{
                background: activo ? cfg.bg : "var(--color-bg-surface)",
                border: `2px solid ${activo ? cfg.color : "var(--color-border-subtle)"}`,
                cursor: "pointer",
              }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: cfg.color }}>
                {cfg.emoji} {cfg.label}
              </p>
              <p className="text-3xl font-black" style={{ color: cfg.color, fontFamily: "var(--font-mono)" }}>{n}</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{cfg.accion}</p>
            </button>
          );
        })}
      </div>

      {/* Alerta legal si hay críticas */}
      {totalCriticas > 0 && (
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: "var(--color-danger-bg)", border: "1px solid var(--color-danger)" }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-danger)" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-danger-text, var(--color-danger))" }}>
              {totalCriticas} equipo(s) en situación crítica de almacenaje
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-danger-text, var(--color-danger))", opacity: 0.85 }}>
              Conforme a la LFPC Art. 63, los equipos con más de 90 días pueden ser dispuestos.
              Envía notificaciones documentadas a los clientes.
            </p>
          </div>
        </div>
      )}

      {/* Tabla */}
      {error ? (
        <div className="rounded-xl p-6 text-center" style={{ background: "var(--color-danger-bg)" }}>
          <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>
        </div>
      ) : loading ? (
        <div className="rounded-xl p-12 flex items-center justify-center gap-3" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}>
          <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--color-text-muted)" }} />
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Cargando órdenes…</span>
        </div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="rounded-xl p-12 flex flex-col items-center gap-3" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}>
          <Package className="w-10 h-10" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {filtroRango === "todos" ? "No hay equipos pendientes de entrega." : "Sin equipos en este rango."}
          </p>
          {filtroRango !== "todos" && (
            <button onClick={() => setFiltroRango("todos")} className="text-xs underline" style={{ color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer" }}>
              Ver todos
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}>
          <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
            <Clock className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              {ordenesFiltradas.length} equipo(s)
              {filtroRango !== "todos" && ` — ${RANGO_CONFIG[filtroRango as keyof typeof RANGO_CONFIG]?.label}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--color-bg-elevated)" }}>
                  {["Folio", "Cliente", "Días", "Rango", "Cobro acum.", "Último aviso", "Acción"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border-subtle)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.map((o) => (
                  <OrdenRow key={o.id} orden={o} onRecordatorio={setOrdenModal} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nota legal al pie */}
      <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
        Marco legal: LFPC Art. 63 · Código de Comercio Art. 373-374 · Tarifa configurable en Configuración
      </p>

      {/* Modal de WA */}
      {ordenModal && (
        <ModalEnviarWA
          orden={ordenModal}
          onClose={() => setOrdenModal(null)}
          onConfirm={handleConfirmarWA}
        />
      )}
    </div>
  );
}
