"use client";

/**
 * FASE 44 — Dashboard especializado para el rol COBRADOR.
 * Muestra: cartera con mora, pagos del día, créditos urgentes y accesos rápidos de cobranza.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, DollarSign, CreditCard, Bell, TrendingDown, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/components/AuthProvider";

interface CobranzaStats {
  creditosConMora: number;
  montoTotalMora: number;
  totalCobradoHoy: number;
  totalPagosHoy: number;
  creditosVencidos: number;
  creditosUrgentes: Array<{
    id: string;
    diasMora: number;
    montoMora: number;
    monto: number;
  }>;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function KPICard({
  label,
  value,
  sub,
  color,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <div
      className="rounded-2xl p-5 flex items-start justify-between"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow 200ms, transform 200ms",
        cursor: href ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (href) {
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
        <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {sub}
          </p>
        )}
      </div>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center ml-4 flex-shrink-0"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Skeleton() {
  return (
    <div
      className="rounded-2xl p-5 animate-pulse"
      style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 rounded mb-3" style={{ background: "var(--color-bg-elevated)" }} />
          <div className="h-7 w-20 rounded mb-2" style={{ background: "var(--color-bg-elevated)" }} />
          <div className="h-3 w-16 rounded" style={{ background: "var(--color-bg-sunken)" }} />
        </div>
        <div className="w-11 h-11 rounded-xl" style={{ background: "var(--color-bg-elevated)" }} />
      </div>
    </div>
  );
}

export function CobradorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CobranzaStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/stats");
        const d = await res.json();
        if (d.success) {
          const s = d.data;
          setStats({
            creditosConMora: s.creditosConMora ?? 0,
            montoTotalMora: s.montoTotalMora ?? 0,
            totalCobradoHoy: s.totalCobradoHoy ?? 0,
            totalPagosHoy: s.totalPagos ?? 0,
            creditosVencidos: s.creditosConMora ?? 0,
            creditosUrgentes: s.creditosAtencion ?? [],
          });
        }
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="p-6 lg:p-8 pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          {saludo}, {user?.name?.split(" ")[0] || "cobrador"} 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Panel de Cobranza · {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
        ) : (
          <>
            <KPICard
              label="Créditos con mora"
              value={stats?.creditosConMora ?? 0}
              sub="Requieren cobro"
              color="var(--color-danger)"
              icon={<AlertTriangle className="w-5 h-5" />}
              href="/dashboard/creditos/cartera-vencida"
            />
            <KPICard
              label="Total en mora"
              value={fmt(stats?.montoTotalMora ?? 0)}
              sub="Saldo vencido acumulado"
              color="var(--color-warning-text)"
              icon={<TrendingDown className="w-5 h-5" />}
              href="/dashboard/creditos/cartera-vencida"
            />
            <KPICard
              label="Cobrado hoy"
              value={fmt(stats?.totalCobradoHoy ?? 0)}
              sub={`${stats?.totalPagosHoy ?? 0} pagos registrados`}
              color="var(--color-success)"
              icon={<CheckCircle2 className="w-5 h-5" />}
              href="/dashboard/pagos"
            />
            <KPICard
              label="Créditos totales"
              value={stats?.creditosVencidos ?? 0}
              sub="Con días de mora"
              color="var(--color-accent)"
              icon={<CreditCard className="w-5 h-5" />}
              href="/dashboard/creditos"
            />
          </>
        )}
      </div>

      {/* Acciones rápidas de cobranza */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <h3 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
            Acciones de cobranza
          </h3>
          <div className="space-y-2">
            {[
              { href: "/dashboard/creditos/cartera-vencida", icon: <AlertTriangle className="w-4 h-4" />, label: "Ver cartera vencida", color: "var(--color-danger)" },
              { href: "/dashboard/pagos", icon: <DollarSign className="w-4 h-4" />, label: "Registrar pago", color: "var(--color-success)" },
              { href: "/dashboard/recordatorios", icon: <Bell className="w-4 h-4" />, label: "Enviar recordatorios", color: "var(--color-accent)" },
              { href: "/dashboard/clientes", icon: <CreditCard className="w-4 h-4" />, label: "Buscar cliente", color: "var(--color-info)" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{
                    border: "1px solid var(--color-border-subtle)",
                    background: "var(--color-bg-base)",
                    transition: "all 180ms var(--ease-smooth)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)";
                    (e.currentTarget as HTMLElement).style.borderColor = item.color;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-bg-base)";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-subtle)";
                  }}
                >
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Créditos urgentes */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Créditos urgentes
              </h3>
              <Link href="/dashboard/creditos/cartera-vencida">
                <span className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
                  Ver todos →
                </span>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "var(--color-bg-elevated)" }} />
                ))}
              </div>
            ) : stats?.creditosUrgentes && stats.creditosUrgentes.length > 0 ? (
              <div className="space-y-2">
                {stats.creditosUrgentes.map((c) => (
                  <Link key={c.id} href={`/dashboard/creditos/${c.id}`}>
                    <div
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        background: c.diasMora > 30 ? "var(--color-danger-bg)" : "var(--color-warning-bg)",
                        border: `1px solid ${c.diasMora > 30 ? "var(--color-danger)" : "var(--color-warning)"}33`,
                        transition: "opacity 150ms",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                          #{c.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                          Mora: {fmt(c.montoMora)} · Crédito: {fmt(c.monto)}
                        </p>
                      </div>
                      <span
                        className="text-xs font-bold px-3 py-1 rounded-full"
                        style={{
                          background: c.diasMora > 30 ? "var(--color-danger)" : "var(--color-warning-text)",
                          color: "white",
                        }}
                      >
                        {c.diasMora} días
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-success)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  Sin créditos urgentes
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  Todos los créditos están al corriente
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
