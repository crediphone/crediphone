"use client";

/**
 * FASE 45 — Página de Recordatorios de Pago con WhatsApp integrado.
 * Envío individual con preview editable + envío masivo por prioridad.
 * Usa BtnNotificarCliente para generar wa.me links con plantillas configurables.
 */

import { useState, useEffect, useCallback } from "react";
import { AlertaCard } from "@/components/recordatorios/AlertaCard";
import { BtnNotificarCliente } from "@/components/notificaciones/BtnNotificarCliente";
import { Card } from "@/components/ui/Card";
import { Bell, RefreshCw, MessageSquare, Send, CheckCircle2, AlertTriangle, Clock, FileText } from "lucide-react";
import type { AlertaRecordatorio, PrioridadAlerta } from "@/lib/types/notificaciones";
import { useConfig } from "@/components/ConfigProvider";

interface RecordatoriosStats {
  urgente: number;
  alta: number;
  media: number;
  baja: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function KPIChip({
  label,
  count,
  sub,
  color,
  icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  sub: string;
  color: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-5 cursor-pointer"
      style={{
        background: active ? `${color}12` : "var(--color-bg-surface)",
        border: `1px solid ${active ? color : "var(--color-border-subtle)"}`,
        boxShadow: active ? `0 0 0 2px ${color}30` : "var(--shadow-sm)",
        transition: "all 200ms var(--ease-smooth)",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
            {label}
          </p>
          <p className="text-3xl font-bold" style={{ color, fontFamily: "var(--font-data)" }}>
            {count}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            {sub}
          </p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 animate-pulse"
      style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-28 rounded mb-3" style={{ background: "var(--color-bg-elevated)" }} />
          <div className="h-8 w-16 rounded mb-2" style={{ background: "var(--color-bg-elevated)" }} />
          <div className="h-3 w-20 rounded" style={{ background: "var(--color-bg-sunken)" }} />
        </div>
        <div className="w-10 h-10 rounded-xl" style={{ background: "var(--color-bg-elevated)" }} />
      </div>
    </div>
  );
}

export default function RecordatoriosPage() {
  const { config } = useConfig();
  const empresaNombre = config?.nombreEmpresa ?? "CREDIPHONE";

  const [alertas, setAlertas] = useState<AlertaRecordatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | PrioridadAlerta>("todos");
  const [soloVencidos, setSoloVencidos] = useState(false);
  const [enviandoMasivo, setEnviandoMasivo] = useState(false);
  const [masivoCuenta, setMasivoCuenta] = useState(0);
  const [contadores, setContadores] = useState<RecordatoriosStats>({ urgente: 0, alta: 0, media: 0, baja: 0 });

  const fetchAlertas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ diasAnticipacion: "7", soloVencidos: soloVencidos.toString() });
      const res = await fetch(`/api/recordatorios?${params}`);
      const result = await res.json();
      if (result.success) {
        setAlertas(result.data.alertas);
        setContadores({
          urgente: result.data.porPrioridad.urgente,
          alta:    result.data.porPrioridad.alta,
          media:   result.data.porPrioridad.media,
          baja:    result.data.porPrioridad.baja,
        });
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [soloVencidos]);

  useEffect(() => { fetchAlertas(); }, [fetchAlertas]);

  const alertasFiltradas = filtro === "todos"
    ? alertas
    : alertas.filter((a) => a.prioridad === filtro);

  // Envío masivo: abre wa.me de todos los filtrados secuencialmente con 800ms de delay
  const handleEnvioMasivo = async () => {
    const conTelefono = alertasFiltradas.filter((a) => a.cliente?.whatsapp || a.cliente?.telefono);
    if (conTelefono.length === 0) return;

    const ok = window.confirm(
      `¿Enviar recordatorio a ${conTelefono.length} cliente${conTelefono.length > 1 ? "s" : ""}?\n\nSe abrirá WhatsApp para cada cliente. Ten en cuenta que tu navegador puede bloquear ventanas emergentes — asegúrate de permitirlas.`
    );
    if (!ok) return;

    setEnviandoMasivo(true);
    setMasivoCuenta(0);

    for (let i = 0; i < conTelefono.length; i++) {
      const alerta = conTelefono[i];
      const tel = (alerta.cliente?.whatsapp || alerta.cliente?.telefono || "").replace(/\D/g, "");
      const telFinal = tel.startsWith("52") ? tel : `52${tel}`;
      const diasMora = alerta.credito?.diasMora ?? 0;
      const tipo = diasMora > 0 ? "aviso_mora" : "recordatorio_pago";

      const vars = {
        nombre:    `${alerta.cliente?.nombre ?? ""} ${alerta.cliente?.apellido ?? ""}`.trim(),
        folio:     alerta.credito?.folio ?? "",
        monto:     fmt(alerta.credito?.monto ?? 0),
        dias_mora: String(diasMora),
        monto_mora: fmt(alerta.credito?.saldoPendiente ?? 0),
        fecha_limite: alerta.credito?.fechaFin
          ? new Date(alerta.credito.fechaFin).toLocaleDateString("es-MX")
          : "",
        empresa: empresaNombre,
      };

      // Cargar plantilla y generar mensaje
      try {
        const res = await fetch("/api/plantillas-notificacion");
        const data = await res.json();
        if (data.success) {
          const p = data.data.find((pl: { tipo: string; activa: boolean }) => pl.tipo === tipo && pl.activa);
          if (p) {
            const mensaje = p.mensaje.replace(/\{(\w+)\}/g, (_: string, k: string) => (vars as Record<string, string>)[k] ?? `{${k}}`);
            const waLink = `https://wa.me/${telFinal}?text=${encodeURIComponent(mensaje)}`;
            window.open(waLink, "_blank");

            // Registrar en historial
            fetch("/api/notificaciones/historial", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tipo, telefono: telFinal, mensaje, canal: "whatsapp", creditoId: alerta.credito?.id }),
            }).catch(() => {});
          }
        }
      } catch {
        // silencioso — no bloquea el siguiente
      }

      setMasivoCuenta(i + 1);
      // Pequeña pausa entre ventanas
      if (i < conTelefono.length - 1) await new Promise((r) => setTimeout(r, 800));
    }

    setEnviandoMasivo(false);
  };

  const kpis = [
    { id: "urgente" as const, label: "Urgente", sub: "Mora > 30 días",  color: "var(--color-danger)",      icon: <AlertTriangle className="w-5 h-5" />, count: contadores.urgente },
    { id: "alta"    as const, label: "Alta",    sub: "Mora 7-30 días",  color: "var(--color-warning-text)", icon: <Bell className="w-5 h-5" />,          count: contadores.alta    },
    { id: "media"   as const, label: "Media",   sub: "Vence 1-3 días",  color: "var(--color-warning)",      icon: <Clock className="w-5 h-5" />,         count: contadores.media   },
    { id: "baja"    as const, label: "Baja",    sub: "Vence 4-7 días",  color: "var(--color-info)",         icon: <FileText className="w-5 h-5" />,      count: contadores.baja    },
  ];

  return (
    <div className="p-6 lg:p-8 pb-24">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            Recordatorios de Pago
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Créditos que requieren seguimiento — notifica a tus clientes por WhatsApp con un clic
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAlertas}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              transition: "all 180ms",
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-surface)"}
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>

          {alertasFiltradas.length > 0 && (
            <button
              onClick={handleEnvioMasivo}
              disabled={enviandoMasivo}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: enviandoMasivo ? "var(--color-accent-hover)" : "var(--color-accent)",
                color: "white",
                opacity: enviandoMasivo ? 0.75 : 1,
                transition: "all 180ms",
              }}
            >
              <Send className="w-4 h-4" />
              {enviandoMasivo
                ? `Enviando ${masivoCuenta}/${alertasFiltradas.filter((a) => a.cliente?.whatsapp || a.cliente?.telefono).length}…`
                : `Enviar masivo (${alertasFiltradas.filter((a) => a.cliente?.whatsapp || a.cliente?.telefono).length})`}
            </button>
          )}
        </div>
      </div>

      {/* KPIs de prioridad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : kpis.map((k) => (
              <KPIChip
                key={k.id}
                label={k.label}
                count={k.count}
                sub={k.sub}
                color={k.color}
                icon={k.icon}
                active={filtro === k.id}
                onClick={() => setFiltro(filtro === k.id ? "todos" : k.id)}
              />
            ))}
      </div>

      {/* Barra de filtros */}
      <div
        className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-2xl"
        style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}
      >
        <div className="flex flex-wrap gap-2 flex-1">
          {([["todos", "Todos"] as const, ...kpis.map((k) => [k.id, k.label] as const)]).map(([id, lbl]) => (
            <button
              key={id}
              onClick={() => setFiltro(id as "todos" | PrioridadAlerta)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: filtro === id ? "var(--color-primary)" : "var(--color-bg-elevated)",
                color: filtro === id ? "white" : "var(--color-text-secondary)",
                border: "1px solid transparent",
                transition: "all 150ms",
              }}
            >
              {lbl} {id !== "todos" ? `(${kpis.find((k) => k.id === id)?.count ?? 0})` : `(${alertas.length})`}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <div
            className="relative w-10 h-5 rounded-full"
            style={{ background: soloVencidos ? "var(--color-accent)" : "var(--color-bg-elevated)", transition: "background 200ms" }}
            onClick={() => setSoloVencidos(!soloVencidos)}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full"
              style={{
                background: "white",
                left: soloVencidos ? "calc(100% - 1.125rem)" : "0.125rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 200ms var(--ease-smooth)",
              }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Solo vencidos
          </span>
        </label>
      </div>

      {/* Lista de alertas */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--color-bg-surface)" }} />
          ))}
        </div>
      ) : alertasFiltradas.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--color-success)" }} />
          <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            {filtro === "todos" ? "Sin recordatorios pendientes" : `Sin alertas de prioridad ${filtro}`}
          </h3>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {soloVencidos ? "Todos los créditos están al día" : "Excelente — la cartera está controlada"}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Mostrando {alertasFiltradas.length} de {alertas.length} recordatorios
            </p>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" style={{ color: "var(--color-accent)" }} />
              <p className="text-xs" style={{ color: "var(--color-accent)" }}>
                {alertasFiltradas.filter((a) => a.cliente?.whatsapp || a.cliente?.telefono).length} con WhatsApp
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {alertasFiltradas.map((alerta) => {
              const tel = alerta.cliente?.whatsapp || alerta.cliente?.telefono || "";
              const diasMora = alerta.credito?.diasMora ?? 0;
              const tipoPlan = diasMora > 0 ? "aviso_mora" : "recordatorio_pago";
              const nombre = `${alerta.cliente?.nombre ?? ""} ${alerta.cliente?.apellido ?? ""}`.trim();

              return (
                <div key={alerta.credito?.id} className="relative">
                  <AlertaCard alerta={alerta} onEnviado={() => fetchAlertas()} />
                  {/* Overlay con BtnNotificarCliente integrado */}
                  {tel && (
                    <div className="absolute top-3 right-3">
                      <BtnNotificarCliente
                        tipo={tipoPlan}
                        telefono={tel}
                        vars={{
                          nombre,
                          folio:       alerta.credito?.folio ?? "",
                          monto:       fmt(alerta.credito?.monto ?? 0),
                          dias_mora:   String(diasMora),
                          monto_mora:  fmt(alerta.credito?.saldoPendiente ?? 0),
                          fecha_limite: alerta.credito?.fechaFin
                            ? new Date(alerta.credito.fechaFin).toLocaleDateString("es-MX")
                            : "",
                          empresa: empresaNombre,
                        }}
                        label="WhatsApp"
                        size="sm"
                        variant="outline"
                        onEnviado={() => fetchAlertas()}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
