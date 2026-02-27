"use client";

import { useEffect, useState } from "react";
import { KPIsReparaciones } from "@/components/reparaciones/dashboard/KPIsReparaciones";
import { GraficaEstados } from "@/components/reparaciones/dashboard/GraficaEstados";
import { GraficaIngresos } from "@/components/reparaciones/dashboard/GraficaIngresos";
import { GraficaDispositivos } from "@/components/reparaciones/dashboard/GraficaDispositivos";
import { TablaOrdenesRecientes } from "@/components/reparaciones/dashboard/TablaOrdenesRecientes";
import { SeccionAlertas } from "@/components/reparaciones/dashboard/SeccionAlertas";
import { CargaTecnicos } from "@/components/reparaciones/dashboard/CargaTecnicos";
import type { DashboardStats } from "@/lib/db/reparaciones-dashboard";
import { Loader2 } from "lucide-react";

export default function DashboardReparacionesPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/reparaciones/dashboard");
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Error al cargar dashboard");
        }

        setData(result.data);
        setError(null);
      } catch (err) {
        console.error("Error al cargar dashboard:", err);
        setError(
          err instanceof Error ? err.message : "Error desconocido"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h2 className="text-red-800 dark:text-red-300 font-semibold mb-2">
              Error al cargar dashboard
            </h2>
            <p className="text-red-600 dark:text-red-400 text-sm">{error || "Error desconocido"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📱 Dashboard de Reparaciones
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitoreo en tiempo real de órdenes, ingresos y carga de trabajo
        </p>
      </div>

      {/* KPIs */}
      <KPIsReparaciones estadisticas={data.kpis} />

      {/* Alertas */}
      <SeccionAlertas alertas={data.alertas} />

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <GraficaEstados data={data.graficas.porEstado} />
        <GraficaIngresos data={data.graficas.ingresosPorMes} />
        <GraficaDispositivos data={data.graficas.topDispositivos} />
      </div>

      {/* Sección inferior: Tabla y Carga de Técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TablaOrdenesRecientes ordenes={data.ordenesRecientes} />
        <CargaTecnicos tecnicos={data.cargaTecnicos} />
      </div>

      {/* Tasa de Aprobación */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Tasa de Aprobación de Presupuestos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Presupuestos</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.tasaAprobacion.totalPresupuestos}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aprobados</p>
              <p className="text-2xl font-bold text-green-600">
                {data.tasaAprobacion.aprobados}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rechazados</p>
              <p className="text-2xl font-bold text-red-600">
                {data.tasaAprobacion.rechazados}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tasa de Aprobación</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.tasaAprobacion.tasaAprobacion.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
