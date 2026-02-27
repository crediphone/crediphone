"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";

interface GraficaEstadosProps {
  data: Record<string, number>;
}

const COLORES_ESTADO: Record<string, string> = {
  recibido: "#3B82F6", // blue-500
  diagnostico: "#F59E0B", // amber-500
  presupuesto: "#F97316", // orange-500
  aprobado: "#10B981", // emerald-500
  en_reparacion: "#8B5CF6", // violet-500
  completado: "#22C55E", // green-500
  listo_entrega: "#06B6D4", // cyan-500
  entregado: "#14B8A6", // teal-500
  no_reparable: "#EF4444", // red-500
  cancelado: "#6B7280", // gray-500
};

const NOMBRES_ESTADO: Record<string, string> = {
  recibido: "Recibido",
  diagnostico: "Diagnóstico",
  presupuesto: "Presupuesto",
  aprobado: "Aprobado",
  en_reparacion: "En Reparación",
  completado: "Completado",
  listo_entrega: "Listo Entrega",
  entregado: "Entregado",
  no_reparable: "No Reparable",
  cancelado: "Cancelado",
};

export function GraficaEstados({ data }: GraficaEstadosProps) {
  // Convertir a formato para Recharts
  const chartData = Object.entries(data)
    .map(([estado, cantidad]) => ({
      name: NOMBRES_ESTADO[estado] || estado,
      value: cantidad,
      estado,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <Card title="📊 Órdenes por Estado">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No hay datos disponibles
        </div>
      </Card>
    );
  }

  return (
    <Card title="📊 Órdenes por Estado">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORES_ESTADO[entry.estado] || "#94A3B8"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [
                `${value || 0} órdenes (${value && total ? ((value / total) * 100).toFixed(1) : 0}%)`,
                "",
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
