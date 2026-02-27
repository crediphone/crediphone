"use client";

import { Card } from "@/components/ui/Card";
import type { EstadisticasTecnico } from "@/types";
import { cn } from "@/lib/utils";

interface CargaTecnicosProps {
  tecnicos: EstadisticasTecnico[];
}

export function CargaTecnicos({ tecnicos }: CargaTecnicosProps) {
  if (!tecnicos || tecnicos.length === 0) {
    return (
      <Card title="👷 Carga de Técnicos">
        <div className="text-center py-8 text-gray-500">
          No hay técnicos registrados
        </div>
      </Card>
    );
  }

  const getCargaColor = (total: number) => {
    if (total < 10) return "bg-green-500";
    if (total < 15) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getCargaTextColor = (total: number) => {
    if (total < 10) return "text-green-600";
    if (total < 15) return "text-yellow-600";
    return "text-red-600";
  };

  const getCargaPercentage = (total: number) => {
    const max = 20; // Máximo considerado para la barra
    return Math.min((total / max) * 100, 100);
  };

  const getCargaLabel = (total: number) => {
    if (total < 10) return "Baja";
    if (total < 15) return "Media";
    return "Alta";
  };

  return (
    <Card title="👷 Carga de Trabajo - Técnicos">
      <div className="space-y-6">
        {tecnicos.map((tecnico) => (
          <div key={tecnico.tecnicoId} className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {tecnico.nombreTecnico}
                </p>
                <p className="text-xs text-gray-500">
                  {tecnico.ordenesRecibidas + tecnico.ordenesDiagnostico + tecnico.ordenesEnReparacion} órdenes totales
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-lg font-bold",
                    getCargaTextColor(tecnico.ordenesActivas)
                  )}
                >
                  {tecnico.ordenesActivas}
                </p>
                <p className="text-xs text-gray-500">
                  {getCargaLabel(tecnico.ordenesActivas)}
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={cn(
                  "h-3 rounded-full transition-all duration-300",
                  getCargaColor(tecnico.ordenesActivas)
                )}
                style={{
                  width: `${getCargaPercentage(tecnico.ordenesActivas)}%`,
                }}
              />
            </div>

            {/* Desglose de estados */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded">
                <p className="text-gray-600">Diagnóstico</p>
                <p className="font-semibold text-blue-600">
                  {tecnico.ordenesDiagnostico || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <p className="text-gray-600">En Reparación</p>
                <p className="font-semibold text-purple-600">
                  {tecnico.ordenesEnReparacion || 0}
                </p>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <p className="text-gray-600">Completadas Hoy</p>
                <p className="font-semibold text-green-600">
                  {tecnico.ordenesCompletadasHoy || 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
