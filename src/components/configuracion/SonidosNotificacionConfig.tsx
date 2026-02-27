"use client";

/**
 * CREDIPHONE — Configuración de Sonidos y Notificaciones Push (FASE 28)
 *
 * Panel completo para:
 *   A. Activar/desactivar sonidos + slider de volumen
 *   B. Seleccionar preset de sonido (6 opciones con botón "Escuchar")
 *   C. Mapeo de evento → sonido
 *   D. Upload de sonido personalizado
 *   E. Toggle de notificaciones push en este dispositivo
 */

import { useState, useRef, useCallback } from "react";
import {
  Bell,
  Volume2,
  VolumeX,
  Upload,
  Play,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  SONIDOS_PRESET,
  reproducirSonido,
  reproducirSonidoCustom,
  type SoundId,
} from "@/lib/sounds";
import type { Configuracion } from "@/types";

interface Props {
  config: Configuracion;
  onSaved: () => void;
}

const TIPOS_EVENTO: Array<{ key: string; label: string }> = [
  { key: "cliente_aprobo",        label: "Cliente aprobó presupuesto" },
  { key: "cliente_rechazo",       label: "Cliente rechazó presupuesto" },
  { key: "nueva_orden",           label: "Nueva orden recibida" },
  { key: "presupuesto_pendiente", label: "Presupuesto pendiente de aprobación" },
];

const SONIDO_IDS = Object.keys(SONIDOS_PRESET) as SoundId[];

// Estado de permisos push
type PushStatus = "idle" | "requesting" | "active" | "denied" | "unsupported";

export function SonidosNotificacionConfig({ config, onSaved }: Props) {
  const sc = config.sonidosConfig;

  const [habilitado, setHabilitado]   = useState(sc?.habilitado ?? true);
  const [volumen, setVolumen]         = useState(Math.round((sc?.volumen ?? 0.7) * 100));
  const [preset, setPreset]           = useState<SoundId>(sc?.sonidoDefault ?? "cristal");
  const [mapeoEventos, setMapeo]      = useState<Record<string, SoundId>>(
    sc?.mapeoEventos ?? {
      cliente_aprobo:        "arpegio",
      cliente_rechazo:       "pulso",
      nueva_orden:           "doble_ding",
      presupuesto_pendiente: "cristal",
    }
  );
  const [customUrl, setCustomUrl]     = useState<string | null>(sc?.sonidoCustomUrl ?? null);

  const [saving, setSaving]           = useState(false);
  const [saveOk, setSaveOk]           = useState(false);
  const [saveErr, setSaveErr]         = useState<string | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [pushStatus, setPushStatus]   = useState<PushStatus>(
    typeof window !== "undefined" && !("Notification" in window)
      ? "unsupported"
      : "idle"
  );
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Escuchar un preset ────────────────────────────────────────────────────
  function handleEscuchar(id: SoundId) {
    reproducirSonido(id, volumen / 100).catch(() => {});
  }

  // ── Upload de sonido custom ───────────────────────────────────────────────
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_048_576) {
      alert("El archivo no puede superar 1 MB.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bucket", "sounds");
      form.append("path", `${config.distribuidorId ?? "global"}/notif-custom.${file.name.split(".").pop()}`);

      const res = await fetch("/api/storage/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        setCustomUrl(data.url);
        // Reproducir para preview
        await reproducirSonidoCustom(data.url, volumen / 100).catch(() => {});
      } else {
        alert("Error al subir el archivo.");
      }
    } finally {
      setUploading(false);
    }
  }

  // ── Guardar config ────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveOk(false);
    setSaveErr(null);
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sonidosConfig: {
            habilitado,
            volumen: volumen / 100,
            sonidoDefault: preset,
            mapeoEventos,
            sonidoCustomUrl: customUrl,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveOk(true);
        onSaved();
        setTimeout(() => setSaveOk(false), 2500);
      } else {
        setSaveErr(data.error ?? "Error al guardar");
      }
    } catch {
      setSaveErr("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  // ── Push: solicitar permiso + suscribir ───────────────────────────────────
  const handleActivarPush = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("unsupported");
      return;
    }
    setPushStatus("requesting");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY no configurado");
        setPushStatus("active"); // modo "demo" sin clave
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      // Enviar suscripción al servidor
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey("p256dh")),
            auth:   arrayBufferToBase64(sub.getKey("auth")),
          },
        }),
      });
      if (res.ok) {
        setPushStatus("active");
      } else {
        setPushStatus("idle");
      }
    } catch {
      setPushStatus("idle");
    }
  }, []);

  const handleDesactivarPush = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
    } finally {
      setPushStatus("idle");
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── A. Toggle + Volumen ─────────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-5"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--color-accent-light)" }}
          >
            <Bell className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              Sonidos de Notificación
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Alertas sonoras cuando llega una notificación al dashboard
            </p>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setHabilitado(!habilitado)}
            className="ml-auto w-11 h-6 rounded-full relative transition-all duration-200 shrink-0"
            style={{
              background: habilitado ? "var(--color-accent)" : "var(--color-border)",
            }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
              style={{ left: habilitado ? "1.375rem" : "0.125rem" }}
            />
          </button>
        </div>

        {/* Volumen */}
        {habilitado && (
          <div className="flex items-center gap-3">
            <VolumeX className="w-4 h-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
            <input
              type="range"
              min={0}
              max={100}
              value={volumen}
              onChange={(e) => setVolumen(Number(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "var(--color-accent)" }}
            />
            <Volume2 className="w-4 h-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
            <span
              className="text-xs font-mono w-9 text-right tabular-nums"
              style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-data)" }}
            >
              {volumen}%
            </span>
          </div>
        )}
      </div>

      {/* ── B. Selector de preset ──────────────────────────── */}
      {habilitado && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{
              color: "var(--color-text-muted)",
              borderBottom: "1px solid var(--color-border-subtle)",
            }}
          >
            Sonido predeterminado
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SONIDO_IDS.map((id) => {
              const s = SONIDOS_PRESET[id];
              const activo = preset === id;
              return (
                <div
                  key={id}
                  className="rounded-xl p-3 cursor-pointer transition-all duration-200 relative"
                  style={{
                    background: activo ? "var(--color-accent-light)" : "var(--color-bg-elevated)",
                    border: `1px solid ${activo ? "var(--color-accent)" : "var(--color-border-subtle)"}`,
                    boxShadow: activo ? "var(--shadow-sm)" : "none",
                  }}
                  onClick={() => setPreset(id)}
                >
                  {activo && (
                    <CheckCircle2
                      className="absolute top-2 right-2 w-3.5 h-3.5"
                      style={{ color: "var(--color-accent)" }}
                    />
                  )}
                  <p className="text-xl mb-1">{s.emoji}</p>
                  <p className="text-xs font-bold mb-0.5" style={{ color: "var(--color-text-primary)" }}>
                    {s.nombre}
                  </p>
                  <p className="text-xs mb-2 leading-snug" style={{ color: "var(--color-text-muted)" }}>
                    {s.descripcion}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEscuchar(id);
                    }}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                    style={{
                      background: "var(--color-bg-surface)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    <Play className="w-3 h-3" />
                    Escuchar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── C. Mapeo por tipo de evento ────────────────────── */}
      {habilitado && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{
              color: "var(--color-text-muted)",
              borderBottom: "1px solid var(--color-border-subtle)",
            }}
          >
            Sonido por tipo de evento
          </div>
          <div className="divide-y" style={{ borderColor: "var(--color-border-subtle)" }}>
            {TIPOS_EVENTO.map(({ key, label }) => (
              <div key={key} className="px-5 py-3 flex items-center justify-between gap-4">
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {label}
                </span>
                <select
                  value={mapeoEventos[key] ?? preset}
                  onChange={(e) =>
                    setMapeo((prev) => ({ ...prev, [key]: e.target.value as SoundId }))
                  }
                  className="text-xs px-2 py-1.5 rounded-lg"
                  style={{
                    background: "var(--color-bg-sunken)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  {SONIDO_IDS.map((id) => (
                    <option key={id} value={id}>
                      {SONIDOS_PRESET[id].emoji} {SONIDOS_PRESET[id].nombre}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── D. Sonido custom (upload) ──────────────────────── */}
      {habilitado && (
        <div
          className="rounded-xl p-5 space-y-3"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div>
            <p className="text-sm font-bold mb-0.5" style={{ color: "var(--color-text-primary)" }}>
              Sonido personalizado (opcional)
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Sube tu propio sonido .mp3, .ogg o .wav (máx 1 MB). Si está activo, reemplaza al preset.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={fileRef}
              type="file"
              accept=".mp3,.ogg,.wav,audio/*"
              className="hidden"
              onChange={handleUpload}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? "Subiendo…" : "Subir sonido"}
            </button>

            {customUrl && (
              <>
                <button
                  onClick={() => reproducirSonidoCustom(customUrl, volumen / 100).catch(() => {})}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{
                    background: "var(--color-success-bg)",
                    border: "1px solid var(--color-success)",
                    color: "var(--color-success-text)",
                    cursor: "pointer",
                  }}
                >
                  <Play className="w-3.5 h-3.5" />
                  Probar
                </button>
                <button
                  onClick={() => setCustomUrl(null)}
                  className="text-xs px-2 py-2 rounded-lg"
                  style={{
                    color: "var(--color-danger)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Quitar
                </button>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Sonido custom activo ✓
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── E. Push notifications ─────────────────────────── */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "var(--color-primary-light)" }}
          >
            <Smartphone className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold mb-0.5" style={{ color: "var(--color-text-primary)" }}>
              Notificaciones push en este dispositivo
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              Recibe alertas aunque el navegador esté cerrado — llegan a la barra de notificaciones
              de tu celular o escritorio, igual que WhatsApp o Facebook.
            </p>
          </div>
        </div>

        {/* Estado + botón */}
        <div className="flex items-center gap-3 flex-wrap">
          {pushStatus === "unsupported" && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <AlertCircle className="w-4 h-4" />
              Tu navegador no soporta notificaciones push
            </div>
          )}

          {pushStatus === "denied" && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-danger)" }}>
              <AlertCircle className="w-4 h-4" />
              Permiso denegado — actívalos manualmente en la configuración del navegador
            </div>
          )}

          {pushStatus === "active" && (
            <>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-success)" }}>
                <CheckCircle2 className="w-4 h-4" />
                Activas en este dispositivo
              </div>
              <button
                onClick={handleDesactivarPush}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: "var(--color-danger-bg)",
                  border: "1px solid var(--color-danger)",
                  color: "var(--color-danger-text)",
                  cursor: "pointer",
                }}
              >
                Desactivar
              </button>
            </>
          )}

          {(pushStatus === "idle" || pushStatus === "requesting") && (
            <button
              onClick={handleActivarPush}
              disabled={pushStatus === "requesting"}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: "var(--color-primary)",
                color: "var(--color-primary-text)",
                border: "none",
                cursor: pushStatus === "requesting" ? "not-allowed" : "pointer",
                opacity: pushStatus === "requesting" ? 0.7 : 1,
              }}
            >
              {pushStatus === "requesting" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {pushStatus === "requesting" ? "Solicitando permiso…" : "Activar notificaciones push"}
            </button>
          )}
        </div>
      </div>

      {/* ── Guardar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        {saveErr && (
          <p className="text-xs" style={{ color: "var(--color-danger)" }}>
            {saveErr}
          </p>
        )}
        {saveOk && (
          <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-success)" }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Configuración guardada
          </p>
        )}
        {!saveErr && !saveOk && <span />}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{
            background: "var(--color-primary)",
            color: "var(--color-primary-text)",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
            transition: "background 200ms",
          }}
          onMouseEnter={(e) =>
            !saving &&
            ((e.currentTarget as HTMLElement).style.background =
              "var(--color-primary-mid)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--color-primary)")
          }
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Guardando…" : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}

// ── Utilidades push ───────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const uint8 = new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
