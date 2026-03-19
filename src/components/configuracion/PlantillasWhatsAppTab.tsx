"use client";

/**
 * FASE 45 — Tab "Plantillas WhatsApp" en Configuración.
 * Permite al admin ver, editar y restaurar cada plantilla de mensaje.
 */

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, RefreshCw, Save, ChevronDown, ChevronRight, Tag } from "lucide-react";
import type { Plantilla, CategoriaPlantilla } from "@/lib/plantillas-notificacion";
import { VARIABLES_DISPONIBLES } from "@/lib/plantillas-notificacion";

// ─── helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: "var(--color-bg-elevated)" }}
    />
  );
}

const CATEGORIA_LABELS: Record<CategoriaPlantilla, string> = {
  credito: "Créditos",
  reparacion: "Reparaciones",
};

const CATEGORIA_COLORS: Record<CategoriaPlantilla, string> = {
  credito: "var(--color-info)",
  reparacion: "var(--color-accent)",
};

// ─── Editor individual de plantilla ───────────────────────────────────────────

interface EditorPlantillaProps {
  plantilla: Plantilla;
  onSaved: () => void;
}

function EditorPlantilla({ plantilla, onSaved }: EditorPlantillaProps) {
  const [expanded, setExpanded] = useState(false);
  const [mensaje, setMensaje] = useState(plantilla.mensaje);
  const [esPersonalizada, setEsPersonalizada] = useState(plantilla.distribuidorId !== null);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showVars, setShowVars] = useState(false);

  // Actualizar cuando cambia la plantilla padre
  useEffect(() => {
    setMensaje(plantilla.mensaje);
    setEsPersonalizada(plantilla.distribuidorId !== null);
  }, [plantilla]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/plantillas-notificacion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: plantilla.tipo, mensaje }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Error al guardar");
      setEsPersonalizada(true);
      setMsg({ type: "success", text: "Guardado correctamente" });
      onSaved();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Error al guardar" });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleRestore = async () => {
    if (!esPersonalizada) return;
    if (!confirm("¿Restaurar la plantilla al texto predeterminado global?")) return;
    setRestoring(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/plantillas-notificacion?tipo=${encodeURIComponent(plantilla.tipo)}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Error al restaurar");
      setMsg({ type: "success", text: "Restaurada al texto predeterminado" });
      onSaved();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Error al restaurar" });
    } finally {
      setRestoring(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const insertVar = (clave: string) => {
    const textarea = document.getElementById(`ta-${plantilla.tipo}`) as HTMLTextAreaElement | null;
    if (!textarea) {
      setMensaje((prev) => prev + `{${clave}}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newVal = mensaje.substring(0, start) + `{${clave}}` + mensaje.substring(end);
    setMensaje(newVal);
    // Devolver foco con cursor después de la variable insertada
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + clave.length + 2;
      textarea.selectionEnd = start + clave.length + 2;
    }, 10);
  };

  const hasChanges = mensaje !== plantilla.mensaje;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-surface)",
      }}
    >
      {/* Header colapsable */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
        style={{
          background: expanded ? "var(--color-bg-elevated)" : "transparent",
          transition: "background 150ms",
        }}
        onClick={() => setExpanded((x) => !x)}
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-text-muted)" }} />
          : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-text-muted)" }} />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {plantilla.nombre}
            </span>
            {esPersonalizada && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: "var(--color-accent-light)",
                  color: "var(--color-accent)",
                }}
              >
                Personalizada
              </span>
            )}
            {hasChanges && expanded && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: "var(--color-warning-bg)",
                  color: "var(--color-warning-text)",
                }}
              >
                Sin guardar
              </span>
            )}
          </div>
          {plantilla.descripcion && (
            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: "var(--color-text-muted)" }}
            >
              {plantilla.descripcion}
            </p>
          )}
        </div>
      </button>

      {/* Contenido expandido */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>

          {/* Feedback */}
          {msg && (
            <div
              className="mt-4 p-3 rounded-lg text-xs font-medium"
              style={
                msg.type === "success"
                  ? { background: "var(--color-success-bg)", color: "var(--color-success-text)" }
                  : { background: "var(--color-danger-bg)", color: "var(--color-danger-text)" }
              }
            >
              {msg.type === "success" ? "✓ " : "✕ "}{msg.text}
            </div>
          )}

          {/* Textarea del mensaje */}
          <div className="mt-4">
            <label
              className="block text-xs font-medium mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Mensaje WhatsApp
            </label>
            <textarea
              id={`ta-${plantilla.tipo}`}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={6}
              className="w-full rounded-lg px-3 py-2.5 text-sm resize-y"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-strong)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,153,184,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder="Escribe el mensaje de WhatsApp..."
            />
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              Usa {`{variable}`} para insertar datos dinámicos. Las variables se sustituyen automáticamente al enviar.
            </p>
          </div>

          {/* Variables disponibles */}
          <div>
            <button
              className="flex items-center gap-2 text-xs font-medium"
              style={{ color: "var(--color-accent)" }}
              onClick={() => setShowVars((v) => !v)}
            >
              <Tag className="w-3.5 h-3.5" />
              {showVars ? "Ocultar variables disponibles" : "Ver variables disponibles"}
            </button>

            {showVars && (
              <div
                className="mt-3 p-3 rounded-lg"
                style={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Haz clic en una variable para insertarla en el cursor:
                </p>
                <div className="flex flex-wrap gap-2">
                  {(VARIABLES_DISPONIBLES[plantilla.categoria] || []).map((v) => (
                    <button
                      key={v.clave}
                      title={v.descripcion}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
                      style={{
                        background: "var(--color-bg-surface)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-accent)",
                        transition: "all 150ms",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)";
                        (e.currentTarget as HTMLElement).style.background = "var(--color-accent-light)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                        (e.currentTarget as HTMLElement).style.background = "var(--color-bg-surface)";
                      }}
                      onClick={() => insertVar(v.clave)}
                    >
                      {`{${v.clave}}`}
                      <span style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-ui)" }}>
                        · {v.descripcion}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {esPersonalizada && (
                <button
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border-subtle)",
                    background: "transparent",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                    (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
                    (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                  }}
                  onClick={handleRestore}
                  disabled={restoring}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${restoring ? "animate-spin" : ""}`} />
                  {restoring ? "Restaurando..." : "Restaurar predeterminado"}
                </button>
              )}
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: hasChanges ? "var(--color-accent)" : "var(--color-bg-elevated)",
                color: hasChanges ? "white" : "var(--color-text-muted)",
                transition: "all 200ms var(--ease-spring)",
                cursor: hasChanges ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => {
                if (hasChanges) (e.currentTarget as HTMLElement).style.background = "var(--color-accent-hover)";
              }}
              onMouseLeave={(e) => {
                if (hasChanges) (e.currentTarget as HTMLElement).style.background = "var(--color-accent)";
              }}
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Guardando..." : "Guardar plantilla"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function PlantillasWhatsAppTab() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlantillas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/plantillas-notificacion");
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Error al cargar");
      setPlantillas(d.data as Plantilla[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar plantillas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlantillas();
  }, [fetchPlantillas]);

  // Agrupar por categoría
  const grupos = plantillas.reduce<Record<CategoriaPlantilla, Plantilla[]>>(
    (acc, p) => {
      const cat = p.categoria as CategoriaPlantilla;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    },
    { credito: [], reparacion: [] }
  );

  return (
    <div className="space-y-6">
      {/* Header informativo */}
      <div
        className="flex items-start gap-4 p-4 rounded-xl"
        style={{
          background: "var(--color-accent-light)",
          border: "1px solid var(--color-accent)33",
        }}
      >
        <MessageSquare
          className="w-5 h-5 mt-0.5 flex-shrink-0"
          style={{ color: "var(--color-accent)" }}
        />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
            Plantillas de mensaje WhatsApp
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Personaliza los mensajes que se usan en recordatorios de crédito y notificaciones de reparación.
            Las variables entre {`{llaves}`} se sustituyen automáticamente con los datos del cliente y la orden al momento de enviar.
            Las plantillas personalizadas tienen prioridad sobre las predeterminadas del sistema.
          </p>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <div
          className="p-4 rounded-xl text-sm"
          style={{
            background: "var(--color-danger-bg)",
            color: "var(--color-danger-text)",
            border: "1px solid var(--color-danger)33",
          }}
        >
          <p className="font-medium">Error al cargar plantillas</p>
          <p className="text-xs mt-1">{error}</p>
          <button
            className="text-xs mt-2 underline"
            style={{ color: "var(--color-danger)" }}
            onClick={fetchPlantillas}
          >
            Reintentar
          </button>
        </div>
      ) : (
        (["credito", "reparacion"] as CategoriaPlantilla[]).map((cat) => {
          const lista = grupos[cat] || [];
          if (lista.length === 0) return null;

          return (
            <div key={cat}>
              {/* Encabezado de categoría */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: CATEGORIA_COLORS[cat] }}
                />
                <h4
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {CATEGORIA_LABELS[cat]}
                </h4>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--color-bg-elevated)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {lista.length} plantillas
                </span>
              </div>

              <div className="space-y-2">
                {lista.map((p) => (
                  <EditorPlantilla
                    key={p.id}
                    plantilla={p}
                    onSaved={fetchPlantillas}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
