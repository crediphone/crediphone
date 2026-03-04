"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/AuthProvider";
import { ModalOrden } from "@/components/reparaciones/ModalOrden";

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

interface CajaStatus {
  sesionActiva: boolean;
  folio?: string;
  abiertaPor?: string;
  esMia?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cajaStatus, setCajaStatus] = useState<CajaStatus>({ sesionActiva: false });
  const [modalOrdenOpen, setModalOrdenOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    if (user && ["admin", "vendedor", "super_admin"].includes(user.role)) {
      fetchCajaStatus();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stats");
      const data = await response.json();
      if (data.success) setStats(data.data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCajaStatus = async () => {
    try {
      // Verificar si hay sesión activa del usuario actual
      const res = await fetch(`/api/pos/caja?action=activa&usuarioId=${user?.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCajaStatus({ sesionActiva: true, folio: data.data.folio, esMia: true });
      } else {
        // Verificar si hay alguna sesión activa en el distribuidor (otro vendedor)
        const resAll = await fetch("/api/pos/caja");
        const dataAll = await resAll.json();
        if (dataAll.success && Array.isArray(dataAll.data)) {
          const activa = dataAll.data.find((s: any) => s.estado === "abierta");
          if (activa) {
            setCajaStatus({
              sesionActiva: true,
              folio: activa.folio,
              abiertaPor: activa.empleadoNombre || "otro empleado",
              esMia: false,
            });
          }
        }
      }
    } catch {}
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

  // Determinar qué acciones rápidas mostrar según rol
  const getRoleLabel = () => {
    if (!user) return "";
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Administrador",
      vendedor: "Vendedor",
      cobrador: "Cobrador",
      tecnico: "Técnico",
    };
    return labels[user.role] || user.role;
  };

  const canSeeCarteraVencida = user && ["admin", "cobrador", "vendedor", "super_admin"].includes(user.role);
  const canUsePOS = user && ["admin", "vendedor", "super_admin"].includes(user.role);
  const canSeeReparaciones = true; // Todos pueden ver reparaciones
  const canSeeEmpleados = user && ["admin", "super_admin"].includes(user.role);
  const canSeeReportes = user && ["admin", "super_admin"].includes(user.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
            style={{ borderColor: "var(--color-accent)" }}
          />
          <p style={{ color: "var(--color-text-muted)" }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 pb-24">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            Dashboard
          </h1>
          <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {user ? `Bienvenido, ${user.name || user.email} · ${getRoleLabel()}` : "Resumen general de CREDIPHONE"}
          </p>
        </div>
        {/* Indicador de caja */}
        {canUsePOS && (
          <Link href="/dashboard/pos/caja">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
              style={{
                background: cajaStatus.sesionActiva
                  ? cajaStatus.esMia ? "var(--color-success-bg)" : "var(--color-warning-bg)"
                  : "var(--color-bg-surface)",
                border: `1px solid ${cajaStatus.sesionActiva ? cajaStatus.esMia ? "var(--color-success)" : "var(--color-warning)" : "var(--color-border)"}`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: cajaStatus.sesionActiva
                    ? cajaStatus.esMia ? "var(--color-success)" : "var(--color-warning)"
                    : "var(--color-text-muted)",
                }}
              />
              <span className="text-xs font-medium" style={{
                color: cajaStatus.sesionActiva
                  ? cajaStatus.esMia ? "var(--color-success-text)" : "var(--color-warning-text)"
                  : "var(--color-text-muted)",
              }}>
                {cajaStatus.sesionActiva
                  ? cajaStatus.esMia
                    ? `Caja abierta · ${cajaStatus.folio}`
                    : `Caja abierta por ${cajaStatus.abiertaPor}`
                  : "Sin caja abierta"}
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Alerta: caja abierta por otro empleado */}
      {canUsePOS && cajaStatus.sesionActiva && !cajaStatus.esMia && (
        <div
          className="mb-6 p-4 rounded-lg flex items-start gap-3"
          style={{
            background: "var(--color-warning-bg)",
            border: "1px solid var(--color-warning)",
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--color-warning-text)" }}>
              {cajaStatus.abiertaPor} tiene la caja abierta ({cajaStatus.folio}).
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-warning-text)" }}>
              Solo puede haber una caja activa a la vez. Si necesitas operar, solicita el cierre de caja.
            </p>
          </div>
          <Link href="/dashboard/pos/caja">
            <button
              className="text-xs font-medium px-3 py-1.5 rounded"
              style={{ background: "var(--color-warning)", color: "white" }}
            >
              Ver Caja
            </button>
          </Link>
        </div>
      )}

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

      {/* Alerta: Créditos con mora */}
      {stats && stats.creditosAtencion && stats.creditosAtencion.length > 0 && canSeeCarteraVencida && (
        <div className="mb-8">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center" style={{ color: "var(--color-text-primary)" }}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-danger)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Créditos que Requieren Atención
              </h3>
              <Link href="/dashboard/creditos/cartera-vencida">
                <span className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
                  Ver cartera vencida →
                </span>
              </Link>
            </div>
            <div className="space-y-3">
              {stats.creditosAtencion.slice(0, 3).map((credito) => (
                <div
                  key={credito.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "var(--color-danger-bg)", border: "1px solid var(--color-danger)" }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      Crédito: {credito.id.slice(0, 8)}...
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      Monto: {formatCurrency(credito.monto)} · Mora: {formatCurrency(credito.montoMora)}
                    </p>
                  </div>
                  <span
                    className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                    style={{ background: "var(--color-danger-bg)", color: "var(--color-danger-text)" }}
                  >
                    {credito.diasMora} días
                  </span>
                </div>
              ))}
              {stats.creditosAtencion.length > 3 && (
                <Link href="/dashboard/creditos/cartera-vencida">
                  <p className="text-sm text-center pt-1" style={{ color: "var(--color-accent)" }}>
                    Ver {stats.creditosAtencion.length - 3} créditos más →
                  </p>
                </Link>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Grid: Acciones Rápidas + Finanzas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Acciones Rápidas — filtradas por rol */}
        <Card>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
            Acciones Rápidas
          </h3>
          <div className="space-y-2">

            {/* Nueva Orden de Servicio — TODOS los roles */}
            <button
              onClick={() => setModalOrdenOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
              style={{
                background: "var(--color-accent-light)",
                border: "1px solid var(--color-accent)",
                transition: "all 200ms var(--ease-spring)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "var(--color-accent)";
                (e.currentTarget as HTMLElement).style.color = "white";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "var(--color-accent-light)";
                (e.currentTarget as HTMLElement).style.color = "";
              }}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-accent)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>Nueva Orden de Servicio</span>
            </button>

            {/* Venta Rápida (POS) — admin, vendedor */}
            {canUsePOS && (
              <Link href="/dashboard/pos">
                <div
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-sunken)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)"}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-secondary)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    Caja Rápida — POS
                  </span>
                  {cajaStatus.sesionActiva && cajaStatus.esMia && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-success-bg)", color: "var(--color-success-text)" }}>
                      Abierta
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* Clientes con Pago Vencido — admin, cobrador, vendedor */}
            {canSeeCarteraVencida && (
              <Link href="/dashboard/creditos/cartera-vencida">
                <div
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-sunken)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)"}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-danger)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Cartera Vencida</span>
                  {(stats?.creditosConMora || 0) > 0 && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--color-danger)", color: "white" }}>
                      {stats?.creditosConMora}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* Registrar Pago — cobrador, admin */}
            {user && ["admin", "cobrador", "super_admin"].includes(user.role) && (
              <Link href="/dashboard/pagos">
                <div
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-sunken)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)"}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-success)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Registrar Pago</span>
                </div>
              </Link>
            )}

            {/* Recordatorios — todos excepto tecnico */}
            {user && user.role !== "tecnico" && (
              <Link href="/dashboard/recordatorios">
                <div
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-sunken)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)"}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-info)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Recordatorios</span>
                  {(stats?.creditosConMora || 0) > 0 && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--color-danger)", color: "white" }}>
                      {stats?.creditosConMora}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* Reparaciones — todos */}
            <Link href="/dashboard/reparaciones">
              <div
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-sunken)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)"}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-secondary)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Reparaciones</span>
              </div>
            </Link>

            {/* Empleados — solo admin */}
            {canSeeEmpleados && (
              <Link href="/dashboard/empleados">
                <div
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-sunken)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)"}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-secondary)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Empleados</span>
                </div>
              </Link>
            )}

            {/* Reportes — solo admin */}
            {canSeeReportes && (
              <Link href="/dashboard/reportes">
                <div
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                  style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-sunken)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)"}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-secondary)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Reportes</span>
                </div>
              </Link>
            )}
          </div>
        </Card>

        {/* Resumen Financiero */}
        <Card>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
            Resumen Financiero
          </h3>
          <div className="space-y-4">
            {[
              { label: "Total en Créditos", value: stats?.montoTotalCreditos || 0, color: "var(--color-text-primary)" },
              { label: "Créditos Activos", value: stats?.montoTotalActivos || 0, color: "var(--color-success)" },
              { label: "Total en Mora", value: stats?.montoTotalMora || 0, color: "var(--color-danger)" },
              { label: "Valor Inventario", value: stats?.valorInventario || 0, color: "var(--color-accent)" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center pb-3"
                style={{ borderBottom: i < 3 ? "1px solid var(--color-border-subtle)" : "none" }}
              >
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
                <span className="text-base font-bold" style={{ color: item.color, fontFamily: "var(--font-data)" }}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Distribución de Riesgo */}
        <Card>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
            Distribución de Riesgo
          </h3>
          <div className="space-y-3">
            {[
              { label: "Riesgo Bajo", value: stats?.riesgoDistribucion?.BAJO || 0, color: "var(--color-success)" },
              { label: "Riesgo Medio", value: stats?.riesgoDistribucion?.MEDIO || 0, color: "var(--color-warning)" },
              { label: "Riesgo Alto", value: stats?.riesgoDistribucion?.ALTO || 0, color: "var(--color-warning-text)" },
              { label: "Riesgo Muy Alto", value: stats?.riesgoDistribucion?.MUY_ALTO || 0, color: "var(--color-danger)" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{item.value}</span>
              </div>
            ))}
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>Basado en scoring crediticio</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Estado del Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Estado del Sistema</h3>
          <div className="space-y-3">
            {[
              { label: "Base de Datos", status: "Conectado", ok: true },
              { label: "API de Clientes", status: "Funcional", ok: true },
              { label: "Módulos Adicionales", status: "En Desarrollo", ok: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.ok ? "var(--color-success)" : "var(--color-warning)" }} />
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
                </div>
                <span className="text-sm font-medium" style={{ color: item.ok ? "var(--color-success)" : "var(--color-warning)" }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Información del Sistema</h3>
          <div className="space-y-2 text-sm">
            {[
              { key: "Versión:", val: "1.0.0" },
              { key: "Framework:", val: "Next.js 16" },
              { key: "Base de Datos:", val: "Supabase (PostgreSQL)" },
              { key: "Última actualización:", val: new Date().toLocaleDateString("es-MX") },
            ].map((item, i) => (
              <div key={i} className="flex justify-between">
                <span style={{ color: "var(--color-text-secondary)" }}>{item.key}</span>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{item.val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ========== BOTÓN FLOTANTE (FAB) ========== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Sub-opciones del FAB */}
        {fabOpen && (
          <div className="flex flex-col items-end gap-2">
            {/* Nueva Orden de Servicio */}
            <button
              onClick={() => { setFabOpen(false); setModalOrdenOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shadow-lg"
              style={{
                background: "var(--color-bg-surface)",
                color: "var(--color-text-primary)",
                boxShadow: "var(--shadow-md)",
                border: "1px solid var(--color-border)",
                whiteSpace: "nowrap",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Nueva Orden de Servicio
            </button>

            {/* Caja Rápida — solo si puede usar POS */}
            {canUsePOS && (
              <button
                onClick={() => { setFabOpen(false); router.push("/dashboard/pos"); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shadow-lg"
                style={{
                  background: "var(--color-bg-surface)",
                  color: "var(--color-text-primary)",
                  boxShadow: "var(--shadow-md)",
                  border: "1px solid var(--color-border)",
                  whiteSpace: "nowrap",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Caja Rápida (POS)
              </button>
            )}

            {/* Nuevo Cliente */}
            {user && !["tecnico"].includes(user.role) && (
              <button
                onClick={() => { setFabOpen(false); router.push("/dashboard/clientes"); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shadow-lg"
                style={{
                  background: "var(--color-bg-surface)",
                  color: "var(--color-text-primary)",
                  boxShadow: "var(--shadow-md)",
                  border: "1px solid var(--color-border)",
                  whiteSpace: "nowrap",
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Nuevo Cliente
              </button>
            )}
          </div>
        )}

        {/* Botón principal FAB */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
          style={{
            background: "var(--color-accent)",
            color: "white",
            boxShadow: "var(--shadow-xl)",
            transition: "all 200ms var(--ease-spring)",
            transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-accent-hover)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--color-accent)"}
          title={fabOpen ? "Cerrar menú" : "Acciones rápidas"}
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Overlay para cerrar FAB */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* Modal Nueva Orden de Servicio */}
      <ModalOrden
        isOpen={modalOrdenOpen}
        onClose={() => setModalOrdenOpen(false)}
        onSuccess={() => {
          setModalOrdenOpen(false);
          router.push("/dashboard/reparaciones");
        }}
      />
    </div>
  );
}
