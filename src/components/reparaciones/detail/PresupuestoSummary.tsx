"use client";

import { Card } from "@/components/ui/Card";
import type { OrdenReparacionDetallada } from "@/types";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface PresupuestoSummaryProps {
  orden: OrdenReparacionDetallada;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export function PresupuestoSummary({ orden }: PresupuestoSummaryProps) {
  // ── Precios: preferir campos nuevos (precio_*), fallar a legacy (costo_*)
  const manoDeObra = orden.presupuestoManoDeObra ?? orden.costoReparacion ?? 0;

  // Partes: preferir presupuestoPiezas, luego piezasCotizacion sum, luego costoPartes
  const piezasCotizacionSum = (orden.piezasCotizacion ?? []).reduce(
    (s, p) => s + (p.precioTotal ?? p.precioUnitario * (p.cantidad ?? 1)),
    0
  );
  const partesDiagSum = (orden.partesReemplazadas ?? []).reduce(
    (s, p) => s + (p.costo ?? 0) * (p.cantidad ?? 1),
    0
  );
  const piezasTotal =
    orden.presupuestoPiezas ??
    (piezasCotizacionSum > 0 ? piezasCotizacionSum : partesDiagSum);

  const total = orden.presupuestoTotal ?? (manoDeObra + piezasTotal);
  const totalAnticipos = (orden as any).totalAnticipos ?? 0;
  const saldoPendiente = Math.max(total - totalAnticipos, 0);
  const cargoCancelacion = orden.cargoCancelacion ?? 0;

  // ── Estado visual del presupuesto
  const estadoPresupuesto =
    orden.estado === "entregado"
      ? "pagado"
      : orden.aprobadoPorCliente
      ? "aprobado"
      : orden.requiereAprobacion
      ? "pendiente_aprobacion"
      : "sin_aprobacion";

  return (
    <div className="space-y-4">

      {/* 1. Banner de estado de aprobación */}
      {estadoPresupuesto === "aprobado" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "var(--color-success-bg, #f0fdf4)", border: "1px solid var(--color-success, #22c55e)" }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-success)" }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--color-success)" }}>
              Presupuesto aprobado
            </p>
            {orden.fechaAprobacion && (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {new Date(orden.fechaAprobacion).toLocaleDateString("es-MX", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      )}
      {estadoPresupuesto === "pendiente_aprobacion" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)" }}>
          <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-warning-text)" }} />
          <p className="text-xs font-semibold" style={{ color: "var(--color-warning-text)" }}>
            Esperando autorización del cliente
          </p>
        </div>
      )}
      {estadoPresupuesto === "pagado" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "var(--color-success-bg, #f0fdf4)", border: "1px solid var(--color-success)" }}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-success)" }} />
          <p className="text-xs font-semibold" style={{ color: "var(--color-success)" }}>Servicio entregado y pagado</p>
        </div>
      )}

      {/* 2. Servicios / piezas cotizadas al crear la orden */}
      {(orden.piezasCotizacion ?? []).length > 0 && (
        <Card>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>
            SERVICIOS COTIZADOS
          </p>
          <div className="space-y-1">
            {(orden.piezasCotizacion ?? []).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5"
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                    {p.nombre}
                    {(p.cantidad ?? 1) > 1 && (
                      <span className="ml-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        ×{p.cantidad}
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-sm font-semibold flex-shrink-0"
                  style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                  {fmt(p.precioTotal ?? p.precioUnitario * (p.cantidad ?? 1))}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Partes diagnosticadas (si vienen del técnico y son diferentes a cotización) */}
      {(orden.partesReemplazadas ?? []).length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
              PARTES A REEMPLAZAR
            </p>
            {(orden.piezasCotizacion ?? []).length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--color-info-bg)", color: "var(--color-info-text)" }}>
                Actualizadas por técnico
              </span>
            )}
          </div>
          <div className="space-y-1">
            {(orden.partesReemplazadas ?? []).map((parte, i) => (
              <div key={i} className="flex items-center justify-between py-1.5"
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                    {parte.parte}
                  </p>
                  {(parte.cantidad ?? 1) > 1 && (
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>×{parte.cantidad}</p>
                  )}
                </div>
                <p className="text-sm font-semibold flex-shrink-0"
                  style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                  {fmt((parte.costo ?? 0) * (parte.cantidad ?? 1))}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 4. Resumen de costos */}
      <Card>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>
          RESUMEN DE COSTOS
        </p>
        <div className="space-y-2">
          {manoDeObra > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Mano de obra</span>
              <span className="text-sm font-medium" style={{ fontFamily: "var(--font-data)", color: "var(--color-text-primary)" }}>
                {fmt(manoDeObra)}
              </span>
            </div>
          )}
          {piezasTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Piezas y refacciones</span>
              <span className="text-sm font-medium" style={{ fontFamily: "var(--font-data)", color: "var(--color-text-primary)" }}>
                {fmt(piezasTotal)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 mt-1"
            style={{ borderTop: "2px solid var(--color-border)" }}>
            <span className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>Total del servicio</span>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-data)", color: "var(--color-accent)" }}>
              {fmt(total)}
            </span>
          </div>
        </div>
      </Card>

      {/* 5. Anticipos y saldo pendiente */}
      {(totalAnticipos > 0 || saldoPendiente > 0) && (
        <Card>
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>
            ESTADO DE PAGO
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Total del servicio</span>
              <span className="text-sm" style={{ fontFamily: "var(--font-data)", color: "var(--color-text-muted)" }}>
                {fmt(total)}
              </span>
            </div>
            {totalAnticipos > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Anticipos recibidos</span>
                <span className="text-sm font-medium" style={{ fontFamily: "var(--font-data)", color: "var(--color-success)" }}>
                  − {fmt(totalAnticipos)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center px-3 py-2 rounded-lg"
              style={{ background: saldoPendiente > 0 ? "var(--color-warning-bg)" : "var(--color-success-bg, #f0fdf4)" }}>
              <span className="text-sm font-semibold"
                style={{ color: saldoPendiente > 0 ? "var(--color-warning-text)" : "var(--color-success)" }}>
                {saldoPendiente > 0 ? "Saldo al recoger" : "Saldo liquidado ✓"}
              </span>
              <span className="text-base font-bold"
                style={{ fontFamily: "var(--font-data)", color: saldoPendiente > 0 ? "var(--color-warning-text)" : "var(--color-success)" }}>
                {fmt(saldoPendiente)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* 6. Cargo de cancelación — siempre visible si existe */}
      {cargoCancelacion > 0 && orden.estado !== "entregado" && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
          style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Cargo mínimo por diagnóstico si se cancela el servicio:{" "}
            <span className="font-semibold" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-data)" }}>
              {fmt(cargoCancelacion)}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
