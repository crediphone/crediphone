"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Printer,
  Loader2,
  ShieldAlert,
  Clock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  VentaDetallada,
  VentaItemDetallado,
  DevolucionElegibilidad,
  DevolucionDetallada,
  MetodoReembolso,
} from "@/types";
import { generarTicketDevolucion, abrirReporte } from "@/lib/utils/reportes";

interface DevolucionModalProps {
  venta: VentaDetallada;
  isOpen: boolean;
  onClose: () => void;
  onDevolucionCreada: (devolucion: DevolucionDetallada) => void;
}

interface ItemSeleccionado {
  ventaItemId: string;
  cantidadDevuelta: number;
  maxCantidad: number;
}

export function DevolucionModal({
  venta,
  isOpen,
  onClose,
  onDevolucionCreada,
}: DevolucionModalProps) {
  // ── Estado ────────────────────────────────────────────────────────────
  const [eligibilidad, setElegibilidad] = useState<DevolucionElegibilidad | null>(null);
  const [loadingElegibilidad, setLoadingElegibilidad] = useState(true);

  const [itemsSeleccionados, setItemsSeleccionados] = useState<
    Record<string, ItemSeleccionado>
  >({});
  const [metodoReembolso, setMetodoReembolso] = useState<MetodoReembolso>("efectivo");
  const [referenciaReembolso, setReferenciaReembolso] = useState("");
  const [motivo, setMotivo] = useState("");

  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devolucionCreada, setDevolucionCreada] = useState<DevolucionDetallada | null>(null);

  // ── Verificar elegibilidad al abrir ───────────────────────────────────
  const verificarElegibilidad = useCallback(async () => {
    if (!venta?.id) return;
    setLoadingElegibilidad(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/pos/devoluciones/elegibilidad?ventaId=${venta.id}`
      );
      const json = await res.json();
      if (json.success) {
        setElegibilidad(json.data);
      } else {
        setErrorMsg(json.error || "Error al verificar elegibilidad");
      }
    } catch {
      setErrorMsg("Error de conexión al verificar elegibilidad");
    } finally {
      setLoadingElegibilidad(false);
    }
  }, [venta?.id]);

  useEffect(() => {
    if (isOpen) {
      verificarElegibilidad();
      // Inicializar selección vacía para todos los items
      const sel: Record<string, ItemSeleccionado> = {};
      (venta.items || []).forEach((item) => {
        sel[item.id] = {
          ventaItemId: item.id,
          cantidadDevuelta: 0,
          maxCantidad: item.cantidad,
        };
      });
      setItemsSeleccionados(sel);
      setMetodoReembolso("efectivo");
      setReferenciaReembolso("");
      setMotivo("");
      setErrorMsg(null);
      setDevolucionCreada(null);
    }
  }, [isOpen, venta, verificarElegibilidad]);

  if (!isOpen) return null;

  // ── Cálculos ──────────────────────────────────────────────────────────
  const itemsConDevolucion = Object.values(itemsSeleccionados).filter(
    (i) => i.cantidadDevuelta > 0
  );

  const montoTotal = itemsConDevolucion.reduce((sum, sel) => {
    const item = venta.items?.find((i) => i.id === sel.ventaItemId);
    if (!item) return sum;
    return sum + item.precioUnitario * sel.cantidadDevuelta;
  }, 0);

  const puedeConfirmar =
    eligibilidad?.elegible && itemsConDevolucion.length > 0 && !procesando;

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleCantidadChange = (itemId: string, cantidad: number) => {
    setItemsSeleccionados((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        cantidadDevuelta: Math.max(0, Math.min(cantidad, prev[itemId].maxCantidad)),
      },
    }));
  };

  const handleSeleccionarTodo = (itemId: string) => {
    setItemsSeleccionados((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        cantidadDevuelta:
          prev[itemId].cantidadDevuelta === prev[itemId].maxCantidad
            ? 0
            : prev[itemId].maxCantidad,
      },
    }));
  };

  const handleConfirmar = async () => {
    if (!puedeConfirmar) return;
    setProcesando(true);
    setErrorMsg(null);

    try {
      const payload = {
        ventaId: venta.id,
        items: itemsConDevolucion.map((sel) => ({
          ventaItemId: sel.ventaItemId,
          cantidadDevuelta: sel.cantidadDevuelta,
        })),
        metodoReembolso,
        referenciaReembolso: referenciaReembolso || undefined,
        motivo: motivo || undefined,
      };

      const res = await fetch("/api/pos/devoluciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Error al procesar devolución");

      setDevolucionCreada(json.data);
      onDevolucionCreada(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Error desconocido");
    } finally {
      setProcesando(false);
    }
  };

  const handleImprimirTicket = () => {
    if (!devolucionCreada) return;
    const html = generarTicketDevolucion({
      folio: devolucionCreada.folio,
      ventaFolio: venta.folio,
      fechaDevolucion: devolucionCreada.createdAt,
      clienteNombre: venta.clienteNombre,
      clienteApellido: venta.clienteApellido,
      items: devolucionCreada.items.map((it) => ({
        productoNombre: it.productoNombre || "Producto",
        cantidadDevuelta: it.cantidadDevuelta,
        precioUnitario: it.precioUnitario,
        subtotalDevuelto: it.subtotalDevuelto,
        imei: it.imei,
      })),
      montoDevuelto: devolucionCreada.montoDevuelto,
      metodoReembolso: devolucionCreada.metodoReembolso,
      referenciaReembolso: devolucionCreada.referenciaReembolso,
      motivo: devolucionCreada.motivo,
    });
    abrirReporte(html, `Devolución ${devolucionCreada.folio}`);
  };

  // ── Render: Éxito ──────────────────────────────────────────────────────
  if (devolucionCreada) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-[9999]" onClick={onClose} />
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
          <div
            className="rounded-xl shadow-xl max-w-md w-full pointer-events-auto"
            style={{ background: "var(--color-bg-surface)" }}
          >
            {/* Header éxito */}
            <div className="flex items-center gap-3 p-6" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-success-bg)" }}
              >
                <CheckCircle className="w-6 h-6" style={{ color: "var(--color-success)" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  Devolución Procesada
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                  {devolucionCreada.folio}
                </p>
              </div>
            </div>

            {/* Resumen */}
            <div className="p-6 space-y-3">
              <div
                className="rounded-lg p-4 space-y-2"
                style={{ background: "var(--color-bg-sunken)" }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>Venta original:</span>
                  <span className="font-medium" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                    {venta.folio}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>Artículos devueltos:</span>
                  <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {devolucionCreada.items.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>Método de reembolso:</span>
                  <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {devolucionCreada.metodoReembolso === "efectivo" ? "Efectivo" : "Transferencia"}
                  </span>
                </div>
                <div
                  className="pt-2 flex justify-between items-baseline"
                  style={{ borderTop: "1px solid var(--color-border-subtle)" }}
                >
                  <span className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    Reembolso:
                  </span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "var(--color-danger)", fontFamily: "var(--font-data)" }}
                  >
                    -${devolucionCreada.montoDevuelto.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                El stock de los productos fue reintegrado automáticamente.
              </p>
            </div>

            {/* Acciones */}
            <div
              className="flex gap-3 p-6"
              style={{ borderTop: "1px solid var(--color-border-subtle)", background: "var(--color-bg-sunken)" }}
            >
              <Button onClick={handleImprimirTicket} variant="secondary" className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Ticket 58mm
              </Button>
              <Button onClick={onClose} className="flex-1">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Render: Loading elegibilidad ───────────────────────────────────────
  if (loadingElegibilidad) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-[9999]" onClick={onClose} />
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
          <div
            className="rounded-xl shadow-xl max-w-md w-full pointer-events-auto p-8 flex flex-col items-center gap-4"
            style={{ background: "var(--color-bg-surface)" }}
          >
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-accent)" }} />
            <p style={{ color: "var(--color-text-muted)" }}>Verificando elegibilidad...</p>
          </div>
        </div>
      </>
    );
  }

  // ── Render: No elegible ────────────────────────────────────────────────
  if (eligibilidad && !eligibilidad.elegible) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-[9999]" onClick={onClose} />
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
          <div
            className="rounded-xl shadow-xl max-w-md w-full pointer-events-auto"
            style={{ background: "var(--color-bg-surface)" }}
          >
            <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "var(--color-danger-bg)" }}
                >
                  {eligibilidad.esPayjoy ? (
                    <ShieldAlert className="w-6 h-6" style={{ color: "var(--color-danger)" }} />
                  ) : (
                    <Clock className="w-6 h-6" style={{ color: "var(--color-danger)" }} />
                  )}
                </div>
                <h2 className="text-lg font-bold" style={{ color: "var(--color-danger)" }}>
                  Devolución No Permitida
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg"
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-elevated)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div
                className="rounded-lg p-4"
                style={{ background: "var(--color-danger-bg)", border: "1px solid rgba(185,28,28,0.2)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--color-danger-text)" }}>
                  {eligibilidad.razon}
                </p>
              </div>

              {/* Info adicional Payjoy */}
              {eligibilidad.esPayjoy && (
                <div
                  className="rounded-lg p-3 flex gap-2"
                  style={{ background: "var(--color-warning-bg)", border: "1px solid rgba(180,83,9,0.2)" }}
                >
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-warning)" }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--color-warning-text)" }}>
                      Política Payjoy
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-warning-text)" }}>
                      Las ventas financiadas con Payjoy tienen una ventana de devolución de 7 días.
                      Si el cliente realizó su primer pago, la cancelación queda anulada.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-text-muted)" }}>Días transcurridos:</span>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {eligibilidad.diasTranscurridos} días
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-text-muted)" }}>Límite máximo:</span>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {eligibilidad.limiteMaximoDias} días
                </span>
              </div>
            </div>

            <div className="p-6" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <Button onClick={onClose} className="w-full">
                Entendido
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Render: Formulario devolución ─────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9999]" onClick={onClose} />
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="rounded-xl shadow-xl max-w-lg w-full pointer-events-auto flex flex-col max-h-[90vh]"
          style={{ background: "var(--color-bg-surface)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-warning-bg)" }}
              >
                <RotateCcw className="w-5 h-5" style={{ color: "var(--color-warning)" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  Procesar Devolución
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                  {venta.folio}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-elevated)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
            </button>
          </div>

          {/* Info elegibilidad */}
          {eligibilidad && (
            <div
              className="flex items-center gap-2 px-6 py-3 text-sm"
              style={{
                background: eligibilidad.esPayjoy ? "var(--color-warning-bg)" : "var(--color-accent-light)",
                borderBottom: "1px solid var(--color-border-subtle)",
              }}
            >
              <Info className="w-4 h-4 flex-shrink-0" style={{ color: eligibilidad.esPayjoy ? "var(--color-warning)" : "var(--color-accent)" }} />
              <span style={{ color: eligibilidad.esPayjoy ? "var(--color-warning-text)" : "var(--color-text-secondary)" }}>
                {eligibilidad.esPayjoy
                  ? `Venta Payjoy — ${eligibilidad.diasTranscurridos} de 7 días permitidos`
                  : `${eligibilidad.diasTranscurridos} de ${eligibilidad.limiteMaximoDias} días transcurridos`}
              </span>
            </div>
          )}

          {/* Contenido scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Selección de artículos */}
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                Selecciona artículos a devolver
              </p>
              <div className="space-y-2">
                {(venta.items || []).map((item) => {
                  const sel = itemsSeleccionados[item.id];
                  if (!sel) return null;
                  const selected = sel.cantidadDevuelta > 0;
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg p-3"
                      style={{
                        background: selected ? "var(--color-accent-light)" : "var(--color-bg-sunken)",
                        border: `1px solid ${selected ? "var(--color-accent)" : "var(--color-border-subtle)"}`,
                        transition: "all 150ms",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {(item as any).productoNombre || "Producto"}
                          </p>
                          {(item as any).imei && (
                            <p className="text-xs" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                              IMEI: {(item as any).imei}
                            </p>
                          )}
                          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                            ${item.precioUnitario.toFixed(2)} c/u · Stock disponible: {item.cantidad}
                          </p>
                        </div>

                        {/* Control de cantidad */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleCantidadChange(item.id, sel.cantidadDevuelta - 1)}
                            disabled={sel.cantidadDevuelta === 0}
                            className="w-7 h-7 rounded flex items-center justify-center text-base font-bold disabled:opacity-30"
                            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-primary)" }}
                          >
                            −
                          </button>
                          <span
                            className="w-6 text-center text-sm font-bold"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {sel.cantidadDevuelta}
                          </span>
                          <button
                            onClick={() => handleCantidadChange(item.id, sel.cantidadDevuelta + 1)}
                            disabled={sel.cantidadDevuelta === sel.maxCantidad}
                            className="w-7 h-7 rounded flex items-center justify-center text-base font-bold disabled:opacity-30"
                            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-primary)" }}
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleSeleccionarTodo(item.id)}
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              background: selected ? "var(--color-accent)" : "var(--color-bg-elevated)",
                              color: selected ? "#fff" : "var(--color-text-secondary)",
                            }}
                          >
                            {selected && sel.cantidadDevuelta === sel.maxCantidad ? "Todo ✓" : "Todo"}
                          </button>
                        </div>
                      </div>

                      {selected && (
                        <div className="mt-2 flex justify-end text-xs font-semibold" style={{ color: "var(--color-accent)" }}>
                          Subtotal: ${(item.precioUnitario * sel.cantidadDevuelta).toFixed(2)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Método de reembolso */}
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                Método de reembolso
              </p>
              <div className="flex gap-3">
                {(["efectivo", "transferencia"] as MetodoReembolso[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetodoReembolso(m)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background:
                        metodoReembolso === m ? "var(--color-accent)" : "var(--color-bg-sunken)",
                      color: metodoReembolso === m ? "#fff" : "var(--color-text-secondary)",
                      border: `1px solid ${metodoReembolso === m ? "var(--color-accent)" : "var(--color-border)"}`,
                    }}
                  >
                    {m === "efectivo" ? "💵 Efectivo" : "🏦 Transferencia"}
                  </button>
                ))}
              </div>

              {metodoReembolso === "transferencia" && (
                <input
                  type="text"
                  placeholder="Referencia / número de transferencia"
                  value={referenciaReembolso}
                  onChange={(e) => setReferenciaReembolso(e.target.value)}
                  className="mt-2 w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "var(--color-bg-sunken)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                />
              )}
            </div>

            {/* Motivo (opcional) */}
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
                Motivo <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(opcional)</span>
              </p>
              <input
                type="text"
                placeholder="Ej: Producto defectuoso, talla incorrecta..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--color-bg-sunken)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <div
                className="flex items-start gap-2 rounded-lg p-3"
                style={{ background: "var(--color-danger-bg)", border: "1px solid rgba(185,28,28,0.2)" }}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--color-danger)" }} />
                <p className="text-sm" style={{ color: "var(--color-danger-text)" }}>{errorMsg}</p>
              </div>
            )}
          </div>

          {/* Footer — total + confirmar */}
          <div
            className="flex-shrink-0 p-6 space-y-3"
            style={{ borderTop: "1px solid var(--color-border-subtle)", background: "var(--color-bg-sunken)" }}
          >
            {itemsConDevolucion.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Total a reembolsar:
                </span>
                <span
                  className="text-xl font-bold"
                  style={{ color: "var(--color-danger)", fontFamily: "var(--font-data)" }}
                >
                  -${montoTotal.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmar}
                disabled={!puedeConfirmar}
                className="flex-1"
                style={
                  puedeConfirmar
                    ? { background: "var(--color-danger)", color: "#fff" }
                    : {}
                }
              >
                {procesando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Confirmar Devolución
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
