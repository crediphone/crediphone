"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  MessageSquare,
  Wrench,
  AlertCircle,
  Package,
  X,
} from "lucide-react";

interface Notificacion {
  id: string;
  ordenId?: string;
  creditoId?: string;
  tipo: string;
  canal: string;
  estado: string;
  mensaje: string;
  datosAdicionales?: any;
  createdAt: string;
  fechaLeido?: string;
}

interface PanelNotificacionesProps {
  usuarioId: string;
  onClose: () => void;
  onActualizado: () => void;
}

// Helper para convertir VAPID key a ArrayBuffer
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer.slice(
    outputArray.byteOffset,
    outputArray.byteOffset + outputArray.byteLength
  );
}

type PushState = "checking" | "unsupported" | "denied" | "inactive" | "active";

export function PanelNotificaciones({
  usuarioId,
  onClose,
  onActualizado,
}: PanelNotificacionesProps) {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Push state — accesible para todos los empleados desde aquí
  const [pushState, setPushState] = useState<PushState>("checking");
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    fetchNotificaciones();
    checkPushState();
  }, []);

  function checkPushState() {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) {
      setPushState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setPushState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushState(sub ? "active" : "inactive"))
      .catch(() => setPushState("inactive"));
  }

  async function activarPush() {
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState("denied");
        return;
      }
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setPushState("active");
    } catch (err) {
      console.error("[Push] Error al activar:", err);
    } finally {
      setPushLoading(false);
    }
  }

  async function desactivarPush() {
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setPushState("inactive");
    } catch (err) {
      console.error("[Push] Error al desactivar:", err);
    } finally {
      setPushLoading(false);
    }
  }

  async function fetchNotificaciones() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/notificaciones?usuario_id=${usuarioId}&limite=20`
      );
      const data = await response.json();
      if (data.success) {
        setNotificaciones(data.data || []);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarcarLeida(id: string) {
    try {
      await fetch("/api/notificaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotificaciones((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, estado: "entregado", fechaLeido: new Date().toISOString() }
            : n
        )
      );
      onActualizado();
    } catch (error) {
      console.error("Error al marcar como leída:", error);
    }
  }

  async function handleMarcarTodas() {
    try {
      await fetch("/api/notificaciones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marcarTodas: true, usuario_id: usuarioId }),
      });
      setNotificaciones((prev) =>
        prev.map((n) => ({
          ...n,
          estado: "entregado",
          fechaLeido: new Date().toISOString(),
        }))
      );
      onActualizado();
    } catch (error) {
      console.error("Error al marcar todas:", error);
    }
  }

  function handleClickNotificacion(notif: Notificacion) {
    if (notif.estado !== "entregado") {
      handleMarcarLeida(notif.id);
    }
    if (notif.ordenId) {
      router.push(`/dashboard/reparaciones/${notif.ordenId}`);
      onClose();
    }
  }

  function getIconoNotificacion(tipo: string) {
    switch (tipo) {
      case "orden_completada":
        return <Wrench className="w-4 h-4" style={{ color: "var(--color-success)" }} />;
      case "orden_lista_entrega":
        return <Package className="w-4 h-4" style={{ color: "var(--color-accent)" }} />;
      case "cliente_aprobo":
        return <CheckCheck className="w-4 h-4" style={{ color: "var(--color-success)" }} />;
      case "cliente_rechazo":
        return <AlertCircle className="w-4 h-4" style={{ color: "var(--color-danger)" }} />;
      case "orden_actualizada":
        return <Bell className="w-4 h-4" style={{ color: "var(--color-warning)" }} />;
      default:
        return <MessageSquare className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />;
    }
  }

  function formatTiempoRelativo(fecha: string): string {
    const ahora = new Date();
    const notifFecha = new Date(fecha);
    const diffMs = ahora.getTime() - notifFecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Ahora";
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return notifFecha.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
    });
  }

  function truncarMensaje(mensaje: string, maxLen: number = 80): string {
    if (mensaje.length <= maxLen) return mensaje;
    return mensaje.substring(0, maxLen) + "...";
  }

  const noLeidas = notificaciones.filter(
    (n) => n.estado === "pendiente" || n.estado === "enviado"
  );

  return (
    <div
      className="absolute right-0 top-full mt-2 w-96 rounded-xl z-50 overflow-hidden"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--color-bg-elevated)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--color-text-primary)" }}
          >
            Notificaciones
          </span>
          {noLeidas.length > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: "var(--color-danger-bg)",
                color: "var(--color-danger)",
              }}
            >
              {noLeidas.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {noLeidas.length > 0 && (
            <button
              onClick={handleMarcarTodas}
              className="text-xs font-medium px-2 py-1 rounded"
              style={{ color: "var(--color-accent)" }}
              title="Marcar todas como leídas"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div
            className="p-6 text-center text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Cargando notificaciones...
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="p-8 text-center">
            <BellOff
              className="w-10 h-10 mx-auto mb-2"
              style={{ color: "var(--color-border)" }}
            />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No hay notificaciones
            </p>
          </div>
        ) : (
          notificaciones.map((notif) => {
            const esNoLeida =
              notif.estado === "pendiente" || notif.estado === "enviado";

            return (
              <button
                key={notif.id}
                onClick={() => handleClickNotificacion(notif)}
                className="w-full text-left px-4 py-3"
                style={{
                  borderBottom: "1px solid var(--color-border-subtle)",
                  background: esNoLeida
                    ? "var(--color-accent-light)"
                    : "transparent",
                  transition: "background 150ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--color-bg-elevated)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = esNoLeida
                    ? "var(--color-accent-light)"
                    : "transparent";
                }}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIconoNotificacion(notif.tipo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${esNoLeida ? "font-medium" : ""}`}
                      style={{
                        color: esNoLeida
                          ? "var(--color-text-primary)"
                          : "var(--color-text-secondary)",
                      }}
                    >
                      {truncarMensaje(notif.mensaje)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {formatTiempoRelativo(notif.createdAt)}
                      </span>
                      {notif.canal === "whatsapp" && (
                        <span
                          className="text-xs flex items-center gap-0.5"
                          style={{ color: "var(--color-success)" }}
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </span>
                      )}
                      {notif.datosAdicionales?.folio && (
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--color-accent)" }}
                        >
                          {notif.datosAdicionales.folio}
                        </span>
                      )}
                    </div>
                  </div>
                  {esNoLeida && (
                    <div className="flex-shrink-0">
                      <div
                        className="w-2 h-2 rounded-full mt-2"
                        style={{ background: "var(--color-accent)" }}
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Push notifications toggle — accesible para TODOS los empleados */}
      {pushState !== "unsupported" && (
        <div
          className="px-4 py-3 flex items-center justify-between gap-2"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <BellRing
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{
                color:
                  pushState === "active"
                    ? "var(--color-success)"
                    : "var(--color-text-muted)",
              }}
            />
            <span
              className="text-xs truncate"
              style={{ color: "var(--color-text-muted)" }}
            >
              {pushState === "checking" && "Verificando..."}
              {pushState === "active" && "Push activo en este dispositivo"}
              {pushState === "inactive" && "Notificaciones push en este dispositivo"}
              {pushState === "denied" && "Push bloqueado — habilitar en el navegador"}
            </span>
          </div>

          {pushState === "inactive" && (
            <button
              onClick={activarPush}
              disabled={pushLoading}
              className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
              style={{
                background: "var(--color-accent-light)",
                color: "var(--color-accent)",
                opacity: pushLoading ? 0.6 : 1,
                cursor: pushLoading ? "wait" : "pointer",
              }}
            >
              {pushLoading ? "..." : "Activar"}
            </button>
          )}

          {pushState === "active" && (
            <button
              onClick={desactivarPush}
              disabled={pushLoading}
              className="text-xs font-medium px-3 py-1 rounded-full flex-shrink-0"
              style={{
                background: "var(--color-bg-elevated)",
                color: "var(--color-text-muted)",
                opacity: pushLoading ? 0.6 : 1,
                cursor: pushLoading ? "wait" : "pointer",
              }}
            >
              {pushLoading ? "..." : "Desactivar"}
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      {notificaciones.length > 0 && (
        <div
          className="px-4 py-2 text-center"
          style={{
            background: "var(--color-bg-elevated)",
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <button
            onClick={() => {
              router.push("/dashboard/recordatorios");
              onClose();
            }}
            className="text-xs font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            Ver todo el historial
          </button>
        </div>
      )}
    </div>
  );
}
