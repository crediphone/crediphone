"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DashboardStats {
  totalClientes: number;
  clientesActivos: number;
  totalCreditos: number;
  creditosActivos: number;
  creditosConMora: number;
  montoTotalCreditos: number;
  montoTotalActivos: number;
  montoTotalMora: number;
  totalPagos: number;
  totalCobradoHoy: number;
  totalProductos: number;
  productosEnStock: number;
  valorInventario: number;
  tasaRecuperacion: number;
  riesgoDistribucion: {
    BAJO: number;
    MEDIO: number;
    ALTO: number;
    MUY_ALTO: number;
  };
  creditosAtencion: Array<{
    id: string;
    clienteId: string;
    diasMora: number;
    montoMora: number;
    monto: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
            style={{ borderColor: "var(--color-accent)" }}
          ></div>
          <p style={{ color: "var(--color-text-muted)" }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Dashboard</h1>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
          Resumen general de CREDIPHONE
        </p>
      </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Clientes"
            value={stats?.totalClientes || 0}
            subtitle={`${stats?.clientesActivos || 0} activos`}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />

          <StatCard
            title="Créditos Activos"
            value={stats?.creditosActivos || 0}
            subtitle={`${stats?.creditosConMora || 0} con mora`}
            color={(stats?.creditosConMora || 0) > 0 ? "yellow" : "green"}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <StatCard
            title="Cobrado Hoy"
            value={formatCurrency(stats?.totalCobradoHoy || 0)}
            subtitle={`${stats?.totalPagos || 0} pagos recibidos`}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatCard
            title="Tasa Recuperación"
            value={`${stats?.tasaRecuperacion?.toFixed(1) || "0"}%`}
            subtitle="Créditos recuperados"
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Alerts Section */}
        {stats && stats.creditosAtencion && stats.creditosAtencion.length > 0 && (
          <div className="mb-8">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center" style={{ color: "var(--color-text-primary)" }}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-danger)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Créditos que Requieren Atención
                </h3>
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {stats.creditosAtencion.length} {stats.creditosAtencion.length === 1 ? "crédito" : "créditos"}
                </span>
              </div>
              <div className="space-y-3">
                {stats.creditosAtencion.map((credito) => (
                  <div
                    key={credito.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      background: "var(--color-danger-bg)",
                      border: "1px solid var(--color-danger)",
                    }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                        Crédito: {credito.id.slice(0, 8)}...
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        Monto: {formatCurrency(credito.monto)} •
                        Mora: {formatCurrency(credito.montoMora)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                        style={{
                          background: "var(--color-danger-bg)",
                          color: "var(--color-danger-text)",
                        }}
                      >
                        {credito.diasMora} días de mora
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Resumen Financiero
            </h3>
            <div className="space-y-4">
              <div
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Total en Créditos</span>
                <span className="text-lg font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                  {formatCurrency(stats?.montoTotalCreditos || 0)}
                </span>
              </div>
              <div
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Créditos Activos</span>
                <span className="text-lg font-bold" style={{ color: "var(--color-success)", fontFamily: "var(--font-data)" }}>
                  {formatCurrency(stats?.montoTotalActivos || 0)}
                </span>
              </div>
              <div
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Total en Mora</span>
                <span className="text-lg font-bold" style={{ color: "var(--color-danger)", fontFamily: "var(--font-data)" }}>
                  {formatCurrency(stats?.montoTotalMora || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Valor Inventario</span>
                <span className="text-lg font-bold" style={{ color: "var(--color-accent)", fontFamily: "var(--font-data)" }}>
                  {formatCurrency(stats?.valorInventario || 0)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Distribución de Riesgo
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ background: "var(--color-success)" }}></div>
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Riesgo Bajo</span>
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {stats?.riesgoDistribucion?.BAJO || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ background: "var(--color-warning)" }}></div>
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Riesgo Medio</span>
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {stats?.riesgoDistribucion?.MEDIO || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ background: "var(--color-warning-text)" }}></div>
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Riesgo Alto</span>
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {stats?.riesgoDistribucion?.ALTO || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ background: "var(--color-danger)" }}></div>
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Riesgo Muy Alto</span>
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {stats?.riesgoDistribucion?.MUY_ALTO || 0}
                </span>
              </div>
              <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                  Basado en scoring crediticio
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Accesos Rápidos
            </h3>
            <div className="space-y-3">
              <Link href="/dashboard/clientes">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Clientes
                </Button>
              </Link>

              <Link href="/dashboard/creditos">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Créditos
                </Button>
              </Link>

              <Link href="/dashboard/pagos">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Pagos
                </Button>
              </Link>

              <Link href="/dashboard/recordatorios">
                <Button variant="secondary" className="w-full justify-start relative">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Recordatorios
                  {stats && stats.creditosConMora > 0 && (
                    <span
                      className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full"
                      style={{ background: "var(--color-danger)", color: "#fff" }}
                    >
                      {stats.creditosConMora}
                    </span>
                  )}
                </Button>
              </Link>

              <Link href="/dashboard/empleados">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Empleados
                </Button>
              </Link>

              <Link href="/dashboard/reparaciones">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Reparaciones
                </Button>
              </Link>

              <Link href="/dashboard/dashboard-reparaciones">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dashboard Reparaciones
                </Button>
              </Link>

              <Link href="/dashboard/productos">
                <Button variant="secondary" className="w-full justify-start">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Productos
                </Button>
              </Link>
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                ✓ Todos los módulos disponibles
              </p>
            </div>
          </Card>
        </div>

        {/* Activity Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Estado del Sistema
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: "var(--color-success)" }} />
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Base de Datos</span>
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--color-success)" }}>Conectado</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: "var(--color-success)" }} />
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>API de Clientes</span>
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--color-success)" }}>Funcional</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: "var(--color-warning)" }} />
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Módulos Adicionales</span>
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--color-warning)" }}>En Desarrollo</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Información del Sistema
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>Versión:</span>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>Framework:</span>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>Next.js 16</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>Base de Datos:</span>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>Supabase (PostgreSQL)</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>Última actualización:</span>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{new Date().toLocaleDateString('es-MX')}</span>
              </div>
            </div>
          </Card>
        </div>
    </div>
  );
}
