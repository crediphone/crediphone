"use client";

import { Card } from "@/components/ui/Card";
import type { OrdenReparacionDetallada, ParteReemplazada } from "@/types";

interface PresupuestoSummaryProps {
  orden: OrdenReparacionDetallada;
}

export function PresupuestoSummary({ orden }: PresupuestoSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const costoPartes =
    orden.partesReemplazadas?.reduce(
      (sum, parte) => sum + parte.costo * parte.cantidad,
      0
    ) || 0;

  const total = orden.costoReparacion + costoPartes;

  return (
    <div className="space-y-6">
      {/* Partes Reemplazadas */}
      {orden.partesReemplazadas && orden.partesReemplazadas.length > 0 && (
        <Card title="Partes a Reemplazar">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Parte
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Costo Unitario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orden.partesReemplazadas.map((parte, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {parte.parte}
                      {parte.proveedor && (
                        <span className="text-xs text-gray-500 block">
                          Proveedor: {parte.proveedor}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {parte.cantidad}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(parte.costo)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(parte.costo * parte.cantidad)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Resumen de Costos */}
      <Card title="Resumen de Costos">
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Mano de Obra</span>
            <span className="text-base font-medium text-gray-900">
              {formatCurrency(orden.costoReparacion)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Partes y Refacciones</span>
            <span className="text-base font-medium text-gray-900">
              {formatCurrency(costoPartes)}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded-lg">
            <span className="text-base font-semibold text-gray-900">
              Total
            </span>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </Card>

      {/* Estado de Aprobación */}
      {orden.requiereAprobacion && (
        <Card>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                orden.aprobadoPorCliente ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {orden.aprobadoPorCliente
                  ? "Presupuesto Aprobado"
                  : "Esperando Aprobación del Cliente"}
              </p>
              {orden.fechaAprobacion && (
                <p className="text-xs text-gray-500">
                  Aprobado el:{" "}
                  {new Date(orden.fechaAprobacion).toLocaleDateString("es-MX")}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
