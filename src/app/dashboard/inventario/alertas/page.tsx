"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Barcode,
  User,
} from "lucide-react";
import type { AlertaProductoNuevoDetallada } from "@/types";

export default function AlertasPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [alertas, setAlertas] = useState<AlertaProductoNuevoDetallada[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  useEffect(() => {
    if (!user?.role || !["admin", "super_admin"].includes(user.role)) {
      router.push("/dashboard");
    } else {
      fetchAlertas();
    }
  }, [user, router, filter]);

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const url =
        filter === "pending"
          ? "/api/inventario/alertas?pending=true"
          : "/api/inventario/alertas";

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setAlertas(data.data);
      }
    } catch (error) {
      console.error("Error fetching alertas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (
    alertaId: string,
    estado: "revisado" | "registrado" | "descartado",
    notas?: string
  ) => {
    try {
      const response = await fetch("/api/inventario/alertas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertaId,
          estado,
          notas,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchAlertas();
      } else {
        alert(data.error || "Error al actualizar alerta");
      }
    } catch (error) {
      console.error("Error updating alerta:", error);
      alert("Error al actualizar alerta");
    }
  };

  const getEstadoConfig = (estado: string) => {
    const configs: Record<
      string,
      { label: string; color: string; icon: React.ReactNode }
    > = {
      pendiente: {
        label: "Pendiente",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
        icon: <Clock className="w-4 h-4" />,
      },
      revisado: {
        label: "Revisado",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      registrado: {
        label: "Registrado",
        color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      descartado: {
        label: "Descartado",
        color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
        icon: <XCircle className="w-4 h-4" />,
      },
    };
    return configs[estado] || configs.pendiente;
  };

  if (!user?.role || !["admin", "super_admin"].includes(user.role)) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Alertas de Productos Nuevos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestione productos escaneados que no están registrados en el sistema
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        <Button
          onClick={() => setFilter("pending")}
          variant={filter === "pending" ? "primary" : "secondary"}
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Pendientes
        </Button>
        <Button
          onClick={() => setFilter("all")}
          variant={filter === "all" ? "primary" : "secondary"}
        >
          Todas
        </Button>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Cargando alertas...
        </div>
      ) : alertas.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {filter === "pending"
              ? "No hay alertas pendientes"
              : "No hay alertas"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === "pending"
              ? "Todos los productos escaneados están registrados"
              : "No se han generado alertas de productos nuevos"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {alertas.map((alerta) => {
            const estadoConfig = getEstadoConfig(alerta.estado);
            return (
              <Card key={alerta.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Barcode className="w-5 h-5 text-gray-400" />
                      <span className="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                        {alerta.codigoEscaneado}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${estadoConfig.color}`}
                      >
                        {estadoConfig.icon}
                        {estadoConfig.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Escaneado por:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {alerta.usuarioEscaner?.name || "Desconocido"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Fecha:
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(alerta.fechaAlerta).toLocaleDateString(
                            "es-MX",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>

                      {alerta.verificacion && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 md:col-span-2">
                          Verificación: {alerta.verificacion.folio}
                        </div>
                      )}
                    </div>

                    {alerta.notas && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Notas:</strong> {alerta.notas}
                        </p>
                      </div>
                    )}

                    {alerta.estado !== "pendiente" && alerta.usuarioRevisor && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        Revisado por: <strong>{alerta.usuarioRevisor.name}</strong>
                        {alerta.fechaRevision && (
                          <span className="ml-2">
                            ({new Date(alerta.fechaRevision).toLocaleDateString("es-MX")})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {alerta.estado === "pendiente" && (
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() =>
                        handleUpdateEstado(alerta.id, "revisado")
                      }
                      variant="secondary"
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar como Revisado
                    </Button>

                    <Button
                      onClick={() => {
                        const notas = prompt(
                          "¿Desea agregar notas sobre el registro de este producto?"
                        );
                        handleUpdateEstado(
                          alerta.id,
                          "registrado",
                          notas || undefined
                        );
                      }}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Producto Registrado
                    </Button>

                    <Button
                      onClick={() => {
                        if (
                          confirm(
                            "¿Descartar esta alerta? El código no se registrará como producto."
                          )
                        ) {
                          handleUpdateEstado(alerta.id, "descartado");
                        }
                      }}
                      variant="danger"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Descartar
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
