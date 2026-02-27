"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EstadoBadge } from "@/components/reparaciones/EstadoBadge";
import type { OrdenReparacionDetallada } from "@/types";
import { useRouter } from "next/navigation";

interface TablaOrdenesRecientesProps {
  ordenes: OrdenReparacionDetallada[];
}

export function TablaOrdenesRecientes({ ordenes }: TablaOrdenesRecientesProps) {
  const router = useRouter();

  if (!ordenes || ordenes.length === 0) {
    return (
      <Card title="📋 Órdenes Recientes">
        <div className="text-center py-8 text-gray-500">
          No hay órdenes recientes
        </div>
      </Card>
    );
  }

  const formatFecha = (fecha: Date | string | null | undefined) => {
    if (!fecha) return "Sin fecha";
    const date = typeof fecha === "string" ? new Date(fecha) : fecha;
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card title="📋 Últimas 10 Órdenes">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Folio
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Cliente
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Dispositivo
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Estado
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Fecha Recepción
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => (
              <tr
                key={orden.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {orden.folio}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">
                  {orden.clienteNombre
                    ? `${orden.clienteNombre} ${orden.clienteApellido || ""}`.trim()
                    : "Sin cliente"}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">
                  {orden.marcaDispositivo} {orden.modeloDispositivo}
                </td>
                <td className="py-3 px-4">
                  <EstadoBadge estado={orden.estado} />
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {formatFecha(orden.fechaRecepcion)}
                </td>
                <td className="py-3 px-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/reparaciones/${orden.id}`)
                    }
                  >
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
