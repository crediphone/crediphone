"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import type { EstadoOrdenReparacion } from "@/types";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Package,
  Wrench,
  DollarSign,
  ThumbsUp,
  Settings,
  ShoppingBag,
  Truck,
  Ban,
  Loader2,
} from "lucide-react";

interface HistorialItem {
  id: string;
  orden_id: string;
  estado_anterior: EstadoOrdenReparacion | null;
  estado_nuevo: EstadoOrdenReparacion;
  notas?: string;
  usuario?: { name: string };
  created_at: string;
}

interface TimelineOrdenProps {
  ordenId: string;
  estadoActual: EstadoOrdenReparacion;
}

const estadoConfig: Record<
  EstadoOrdenReparacion,
  { icon: any; color: string; label: string }
> = {
  recibido: {
    icon: Package,
    color: "bg-blue-500",
    label: "Recibido",
  },
  diagnostico: {
    icon: Wrench,
    color: "bg-yellow-500",
    label: "En Diagnóstico",
  },
  presupuesto: {
    icon: DollarSign,
    color: "bg-orange-500",
    label: "Presupuesto Pendiente",
  },
  aprobado: {
    icon: ThumbsUp,
    color: "bg-green-500",
    label: "Aprobado",
  },
  en_reparacion: {
    icon: Settings,
    color: "bg-purple-500",
    label: "En Reparación",
  },
  completado: {
    icon: CheckCircle,
    color: "bg-green-600",
    label: "Completado",
  },
  listo_entrega: {
    icon: ShoppingBag,
    color: "bg-teal-500",
    label: "Listo para Entrega",
  },
  entregado: {
    icon: Truck,
    color: "bg-gray-500",
    label: "Entregado",
  },
  no_reparable: {
    icon: XCircle,
    color: "bg-red-500",
    label: "No Reparable",
  },
  cancelado: {
    icon: Ban,
    color: "bg-gray-400",
    label: "Cancelado",
  },
};

export function TimelineOrden({ ordenId, estadoActual }: TimelineOrdenProps) {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reparaciones/${ordenId}/historial`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Error al cargar historial");
        }

        setHistorial(result.data || []);
        setError(null);
      } catch (err) {
        console.error("Error al cargar historial:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    if (ordenId) {
      fetchHistorial();
    }
  }, [ordenId]);

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card title="📅 Historial de Estados">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Cargando historial...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="📅 Historial de Estados">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  if (historial.length === 0) {
    return (
      <Card title="📅 Historial de Estados">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No hay historial de cambios</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="📅 Historial de Estados">
      <div className="relative">
        {/* Línea vertical del timeline */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Items del timeline */}
        <div className="space-y-6">
          {historial.map((item, index) => {
            const config = estadoConfig[item.estado_nuevo];
            const Icon = config.icon;
            const isActual = item.estado_nuevo === estadoActual;

            return (
              <div key={item.id} className="relative flex gap-4">
                {/* Icono */}
                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center ${
                      isActual ? "ring-4 ring-blue-200" : ""
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 pb-6">
                  <div
                    className={`bg-white border rounded-lg p-4 ${
                      isActual
                        ? "border-blue-300 shadow-md"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {config.label}
                          {isActual && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Estado Actual
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatFecha(item.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Usuario que hizo el cambio */}
                    {item.usuario?.name && (
                      <p className="text-xs text-gray-600 mb-2">
                        Por: {item.usuario.name}
                      </p>
                    )}

                    {/* Transición */}
                    {item.estado_anterior && (
                      <p className="text-xs text-gray-500 mb-2">
                        {estadoConfig[item.estado_anterior]?.label} →{" "}
                        {config.label}
                      </p>
                    )}

                    {/* Notas */}
                    {item.notas && (
                      <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1 font-medium">
                          Notas:
                        </p>
                        <p className="text-sm text-gray-700">{item.notas}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
