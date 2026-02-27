"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { DispositivoStats } from "@/lib/db/reparaciones-dashboard";

interface GraficaDispositivosProps {
  data: DispositivoStats[];
}

const COLORES = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#F97316", "#14B8A6", "#6366F1", "#EC4899",
];

export function GraficaDispositivos({ data }: GraficaDispositivosProps) {
  if (!data || data.length === 0) {
    return (
      <Card title="📱 Top Dispositivos Reparados">
        <div className="h-64 flex items-center justify-center text-gray-500">
          No hay datos disponibles
        </div>
      </Card>
    );
  }

  // Preparar datos para la gráfica
  const chartData = data.map((item) => ({
    nombre: `${item.marca} ${item.modelo}`,
    cantidad: item.cantidad,
    ingresoTotal: item.ingresoTotal,
  }));

  return (
    <Card title="📱 Top Dispositivos Reparados">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="nombre"
              tick={{ fontSize: 10 }}
              width={120}
            />
            <Tooltip
              formatter={(value: any, name: any) => {
                if (!value) return ["0", name || ""];
                if (name === "Ingresos") {
                  return [
                    new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    }).format(value),
                    name,
                  ];
                }
                return [`${value} reparaciones`, name];
              }}
            />
            <Bar dataKey="cantidad" name="Cantidad" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
