"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

interface ReportesData {
  kpis: {
    creditosNuevosMes: number;
    montoCreditosMes: number;
    cobranzaMes: number;
    pagosCountMes: number;
    creditosActivos: number;
    tasaRecuperacion: number;
    totalCreditos: number;
    totalPagos: number;
  };
  creditosPorMes: Array<{ mes: string; cantidad: number; monto: number }>;
  pagosPorMes: Array<{ mes: string; cantidad: number; monto: number }>;
  estadosCreditos: Record<string, number>;
  metodosPago: Record<string, number>;
  topClientes: Array<{ nombre: string; monto: number }>;
}

const COLORES_ESTADO: Record<string, string> = {
  activo: "#10B981",
  pagado: "#3B82F6",
  vencido: "#EF4444",
  cancelado: "#6B7280",
};

const NOMBRES_ESTADO: Record<string, string> = {
  activo: "Activo",
  pagado: "Pagado",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

const COLORES_METODO: Record<string, string> = {
  efectivo: "#10B981",
  transferencia: "#3B82F6",
  deposito: "#F59E0B",
  mixto: "#8B5CF6",
};

const NOMBRES_METODO: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  deposito: "Deposito",
  mixto: "Mixto",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default function ReportesPage() {
  const [data, setData] = useState<ReportesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const response = await fetch("/api/reportes/pdf", { method: "POST" });
      if (!response.ok) throw new Error("Error al generar PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "reporte.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando PDF:", error);
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/reportes");
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Error cargando reportes:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-gray-600 dark:text-gray-400">Error al cargar reportes</p>
      </div>
    );
  }

  // Preparar datos para PieChart de estados
  const estadosData = Object.entries(data.estadosCreditos)
    .map(([estado, cantidad]) => ({
      name: NOMBRES_ESTADO[estado] || estado,
      value: cantidad,
      estado,
    }))
    .filter((d) => d.value > 0);

  // Preparar datos para PieChart de metodos de pago
  const metodosData = Object.entries(data.metodosPago)
    .map(([metodo, cantidad]) => ({
      name: NOMBRES_METODO[metodo] || metodo,
      value: cantidad,
      metodo,
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes y Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Metricas financieras y tendencias del negocio
          </p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download className={`w-4 h-4 ${downloadingPdf ? "animate-pulse" : ""}`} />
          {downloadingPdf ? "Generando..." : "Descargar PDF"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Creditos Este Mes</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {formatCurrency(data.kpis.montoCreditosMes)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.kpis.creditosNuevosMes} nuevos creditos
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Cobranza del Mes</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(data.kpis.cobranzaMes)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.kpis.pagosCountMes} pagos recibidos
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Creditos Activos</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {data.kpis.creditosActivos}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            de {data.kpis.totalCreditos} totales
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tasa Recuperacion</div>
          <div className="text-3xl font-bold text-amber-600 mt-2">
            {data.kpis.tasaRecuperacion}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.kpis.totalPagos} pagos totales
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tendencia de Creditos */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tendencia de Creditos (6 meses)
          </h3>
          <div className="h-72">
            {data.creditosPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.creditosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    stroke="#9CA3AF"
                  />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#F3F4F6" }}
                    formatter={(value: any, name: any) =>
                      name === "Monto" ? [formatCurrency(value || 0), name] : [value || 0, name || ""]
                    }
                  />
                  <Legend />
                  <Bar yAxisId="right" dataKey="cantidad" name="Cantidad" fill="#94A3B8" opacity={0.5} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="monto"
                    name="Monto"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Sin datos disponibles
              </div>
            )}
          </div>
        </Card>

        {/* Cobranza por Mes */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cobranza por Mes (6 meses)
          </h3>
          <div className="h-72">
            {data.pagosPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pagosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    stroke="#9CA3AF"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#F3F4F6" }}
                    formatter={(value: any) => [formatCurrency(value || 0), "Cobrado"]}
                  />
                  <Bar dataKey="monto" name="Cobrado" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Sin datos disponibles
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Distribucion de Creditos */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribucion de Creditos por Estado
          </h3>
          <div className="h-72">
            {estadosData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {estadosData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORES_ESTADO[entry.estado] || "#94A3B8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#F3F4F6" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Sin datos disponibles
              </div>
            )}
          </div>
        </Card>

        {/* Distribucion de Metodos de Pago */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Metodos de Pago
          </h3>
          <div className="h-72">
            {metodosData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metodosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {metodosData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORES_METODO[entry.metodo] || "#94A3B8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#F3F4F6" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                Sin datos disponibles
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Top Clientes */}
      {data.topClientes.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top 5 Clientes por Credito Activo
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topClientes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  stroke="#9CA3AF"
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  tick={{ fontSize: 11 }}
                  width={120}
                  stroke="#9CA3AF"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px", color: "#F3F4F6" }}
                  formatter={(value: any) => [formatCurrency(value || 0), "Monto"]}
                />
                <Bar dataKey="monto" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
