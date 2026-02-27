"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  Monitor,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from "lucide-react";

interface NotificacionOrden {
  id: string;
  ordenId: string;
  clienteId?: string;
  destinatarioId?: string;
  tipo: string;
  canal: string;
  estado: string;
  mensaje: string;
  telefono?: string;
  fechaEnviado?: string;
  fechaLeido?: string;
  datosAdicionales?: any;
  createdAt: string;
}

interface HistorialNotificacionesProps {
  ordenId: string;
}

export function HistorialNotificaciones({
  ordenId,
}: HistorialNotificacionesProps) {
  const [notificaciones, setNotificaciones] = useState<NotificacionOrden[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificaciones();
  }, [ordenId]);

  async function fetchNotificaciones() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/reparaciones/${ordenId}/notificaciones`
      );
      const data = await response.json();
      if (data.success) {
        setNotificaciones(data.data || []);
      }
    } catch (error) {
      console.error("Error al cargar historial de notificaciones:", error);
    } finally {
      setLoading(false);
    }
  }

  function getIconoCanal(canal: string) {
    switch (canal) {
      case "whatsapp":
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case "sistema":
        return <Monitor className="w-4 h-4 text-blue-500" />;
      case "email":
        return <Send className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  }

  function getIconoEstado(estado: string) {
    switch (estado) {
      case "enviado":
      case "entregado":
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "pendiente":
        return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
      case "fallido":
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-gray-400" />;
    }
  }

  function getLabelEstado(estado: string): string {
    const labels: Record<string, string> = {
      pendiente: "Pendiente",
      enviado: "Enviado",
      entregado: "Leído",
      fallido: "Fallido",
      respondido: "Respondido",
    };
    return labels[estado] || estado;
  }

  function getLabelTipo(tipo: string): string {
    const labels: Record<string, string> = {
      orden_actualizada: "Actualización",
      orden_completada: "Completada",
      orden_lista_entrega: "Lista entrega",
      cliente_aprobo: "Cliente aprobó",
      cliente_rechazo: "Cliente rechazó",
    };
    return labels[tipo] || tipo;
  }

  function getLabelCanal(canal: string): string {
    const labels: Record<string, string> = {
      whatsapp: "WhatsApp",
      sistema: "Sistema",
      email: "Email",
      sms: "SMS",
    };
    return labels[canal] || canal;
  }

  function formatFechaHora(fecha: string): string {
    return new Date(fecha).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Cargando historial de notificaciones...
      </div>
    );
  }

  if (notificaciones.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">
          No hay notificaciones registradas para esta orden
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Las notificaciones se generan automáticamente al cambiar el estado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notificaciones Enviadas ({notificaciones.length})
        </h3>
      </div>

      <div className="space-y-2">
        {notificaciones.map((notif) => (
          <div
            key={notif.id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Ícono canal */}
              <div className="flex-shrink-0 mt-0.5">
                {getIconoCanal(notif.canal)}
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                {/* Header de la notificación */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {getLabelTipo(notif.tipo)}
                  </span>
                  <span className="text-xs text-gray-500">
                    via {getLabelCanal(notif.canal)}
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    {getIconoEstado(notif.estado)}
                    <span className="text-xs text-gray-500">
                      {getLabelEstado(notif.estado)}
                    </span>
                  </div>
                </div>

                {/* Mensaje (truncado) */}
                <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                  {notif.mensaje}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{formatFechaHora(notif.createdAt)}</span>
                  {notif.telefono && (
                    <span className="text-green-600">{notif.telefono}</span>
                  )}
                  {notif.datosAdicionales?.origen === "envio_manual" && (
                    <span className="text-blue-500 font-medium">Manual</span>
                  )}
                  {notif.datosAdicionales?.origen ===
                    "cambio_estado_automatico" && (
                    <span className="text-purple-500 font-medium">
                      Automático
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
