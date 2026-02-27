"use client";

import { useState, useEffect } from "react";
import { AlertaCard } from "@/components/recordatorios/AlertaCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { AlertaRecordatorio, PrioridadAlerta } from "@/lib/types/notificaciones";

interface RecordatoriosStats {
  urgente: number;
  alta: number;
  media: number;
  baja: number;
}

export default function RecordatoriosPage() {
  const [alertas, setAlertas] = useState<AlertaRecordatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | PrioridadAlerta>("todos");
  const [soloVencidos, setSoloVencidos] = useState(false);
  const [contadores, setContadores] = useState<RecordatoriosStats>({
    urgente: 0,
    alta: 0,
    media: 0,
    baja: 0,
  });

  useEffect(() => {
    fetchAlertas();
  }, [soloVencidos]);

  const fetchAlertas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        diasAnticipacion: "7",
        soloVencidos: soloVencidos.toString(),
      });

      const response = await fetch(`/api/recordatorios?${params}`);
      const result = await response.json();

      if (result.success) {
        setAlertas(result.data.alertas);
        setContadores({
          urgente: result.data.porPrioridad.urgente,
          alta: result.data.porPrioridad.alta,
          media: result.data.porPrioridad.media,
          baja: result.data.porPrioridad.baja,
        });
      } else {
        console.error("Error al cargar alertas:", result.error);
        alert("Error al cargar recordatorios");
      }
    } catch (error) {
      console.error("Error al cargar alertas:", error);
      alert("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleEnviado = (creditoId: string) => {
    // Actualizar UI para mostrar que fue enviado
    console.log("Recordatorio enviado para crédito:", creditoId);
    // Opcional: Podríamos actualizar el estado local para marcar como enviado
  };

  const alertasFiltradas =
    filtro === "todos" ? alertas : alertas.filter((a) => a.prioridad === filtro);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando recordatorios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Recordatorios de Pago
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Créditos que requieren seguimiento y notificación a clientes
        </p>
      </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="cursor-pointer"
            onClick={() => setFiltro("urgente")}
          >
            <Card className="bg-red-50 border-red-200 hover:shadow-md transition-shadow">
              <div className="text-center">
                <p className="text-sm font-medium text-red-600 mb-1">
                  🚨 Urgente
                </p>
                <p className="text-4xl font-bold text-red-700">
                  {contadores.urgente}
                </p>
                <p className="text-xs text-red-500 mt-1">Mora &gt; 30 días</p>
              </div>
            </Card>
          </div>

          <div
            className="cursor-pointer"
            onClick={() => setFiltro("alta")}
          >
            <Card className="bg-orange-50 border-orange-200 hover:shadow-md transition-shadow">
              <div className="text-center">
                <p className="text-sm font-medium text-orange-600 mb-1">
                  ⚠️ Alta
                </p>
                <p className="text-4xl font-bold text-orange-700">
                  {contadores.alta}
                </p>
                <p className="text-xs text-orange-500 mt-1">Mora 7-30 días</p>
              </div>
            </Card>
          </div>

          <div
            className="cursor-pointer"
            onClick={() => setFiltro("media")}
          >
            <Card className="bg-yellow-50 border-yellow-200 hover:shadow-md transition-shadow">
              <div className="text-center">
                <p className="text-sm font-medium text-yellow-600 mb-1">
                  ⏰ Media
                </p>
                <p className="text-4xl font-bold text-yellow-700">
                  {contadores.media}
                </p>
                <p className="text-xs text-yellow-500 mt-1">Vence 1-3 días</p>
              </div>
            </Card>
          </div>

          <div
            className="cursor-pointer"
            onClick={() => setFiltro("baja")}
          >
            <Card className="bg-blue-50 border-blue-200 hover:shadow-md transition-shadow">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-600 mb-1">📋 Baja</p>
                <p className="text-4xl font-bold text-blue-700">
                  {contadores.baja}
                </p>
                <p className="text-xs text-blue-500 mt-1">Vence 4-7 días</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 flex flex-wrap gap-2">
              <Button
                variant={filtro === "todos" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFiltro("todos")}
              >
                Todos ({alertas.length})
              </Button>
              <Button
                variant={filtro === "urgente" ? "danger" : "secondary"}
                size="sm"
                onClick={() => setFiltro("urgente")}
              >
                🚨 Urgente ({contadores.urgente})
              </Button>
              <Button
                variant={filtro === "alta" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFiltro("alta")}
              >
                ⚠️ Alta ({contadores.alta})
              </Button>
              <Button
                variant={filtro === "media" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFiltro("media")}
              >
                ⏰ Media ({contadores.media})
              </Button>
              <Button
                variant={filtro === "baja" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFiltro("baja")}
              >
                📋 Baja ({contadores.baja})
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md transition-colors">
                <input
                  type="checkbox"
                  checked={soloVencidos}
                  onChange={(e) => setSoloVencidos(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mr-2"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Solo vencidos
                </span>
              </label>

              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAlertas}
                className="flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Actualizar
              </Button>
            </div>
          </div>
        </Card>

        {/* Lista de Alertas */}
        <div className="space-y-4">
          {alertasFiltradas.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {filtro === "todos"
                    ? "No hay recordatorios pendientes"
                    : `No hay alertas de prioridad ${filtro}`}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {soloVencidos
                    ? "Todos los créditos están al día"
                    : "Excelente trabajo manteniendo los créditos al día"}
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mostrando {alertasFiltradas.length} de {alertas.length}{" "}
                  recordatorios
                </p>
              </div>
              {alertasFiltradas.map((alerta) => (
                <AlertaCard
                  key={alerta.credito.id}
                  alerta={alerta}
                  onEnviado={handleEnviado}
                />
              ))}
            </>
          )}
        </div>
    </div>
  );
}
