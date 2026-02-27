"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  ArrowUpCircle, ArrowDownCircle, Clock, XCircle, Plus, Zap, AlertCircle,
} from "lucide-react";
import type { CajaSesion, CajaMovimiento } from "@/types";

export default function CajaPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [sesionActiva, setSesionActiva] = useState<CajaSesion | null>(null);
  const [loadingSesion, setLoadingSesion] = useState(true);
  const [sesiones, setSesiones] = useState<CajaSesion[]>([]);
  const [movimientos, setMovimientos] = useState<CajaMovimiento[]>([]);

  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [montoInicial, setMontoInicial] = useState("");
  const [notasApertura, setNotasApertura] = useState("");

  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [montoFinal, setMontoFinal] = useState("");
  const [notasCierre, setNotasCierre] = useState("");
  const [payjoyStats, setPayjoyStats] = useState<CajaSesion["payjoyStats"]>(undefined);

  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState<"deposito" | "retiro">("deposito");
  const [montoMovimiento, setMontoMovimiento] = useState("");
  const [conceptoMovimiento, setConceptoMovimiento] = useState("");

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && !["admin", "vendedor", "super_admin"].includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (user) { fetchSesionActiva(); fetchHistorialSesiones(); }
  }, [user]);

  useEffect(() => {
    if (sesionActiva) fetchMovimientos(sesionActiva.id);
  }, [sesionActiva]);

  const fetchSesionActiva = async () => {
    try {
      setLoadingSesion(true);
      const response = await fetch(`/api/pos/caja?action=activa&usuarioId=${user?.id}`);
      const data = await response.json();
      setSesionActiva(data.success && data.data ? data.data : null);
    } catch (error) {
      console.error("Error fetching sesion activa:", error);
    } finally {
      setLoadingSesion(false);
    }
  };

  const fetchHistorialSesiones = async () => {
    try {
      const response = await fetch("/api/pos/caja");
      const data = await response.json();
      if (data.success) setSesiones(data.data);
    } catch (error) {
      console.error("Error fetching sesiones:", error);
    }
  };

  const fetchMovimientos = async (sesionId: string) => {
    try {
      const response = await fetch(`/api/pos/caja/${sesionId}?action=movimientos`);
      const data = await response.json();
      if (data.success) setMovimientos(data.data);
    } catch (error) {
      console.error("Error fetching movimientos:", error);
    }
  };

  const handleAbrirCaja = async () => {
    const monto = parseFloat(montoInicial);
    if (isNaN(monto) || monto < 0) { alert("Ingrese un monto inicial válido"); return; }
    setProcessing(true);
    try {
      const response = await fetch("/api/pos/caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abrir", montoInicial: monto, notas: notasApertura || undefined }),
      });
      const data = await response.json();
      if (data.success) {
        setSesionActiva(data.data); setShowAbrirModal(false); setMontoInicial(""); setNotasApertura("");
        fetchHistorialSesiones();
      } else { alert(data.error || "Error al abrir caja"); }
    } catch (error) {
      console.error("Error opening caja:", error); alert("Error al abrir caja");
    } finally { setProcessing(false); }
  };

  const handleCerrarCaja = async () => {
    if (!sesionActiva) return;
    const monto = parseFloat(montoFinal);
    if (isNaN(monto) || monto < 0) { alert("Ingrese un monto final válido"); return; }
    if (!confirm("¿Cerrar caja y finalizar turno?")) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/pos/caja/${sesionActiva.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cerrar", montoFinal: monto, notas: notasCierre || undefined }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.data?.payjoyStats) setPayjoyStats(data.data.payjoyStats);
        setSesionActiva(null); setShowCerrarModal(false); setMontoFinal(""); setNotasCierre("");
        fetchHistorialSesiones(); alert("Caja cerrada exitosamente");
      } else { alert(data.error || "Error al cerrar caja"); }
    } catch (error) {
      console.error("Error closing caja:", error); alert("Error al cerrar caja");
    } finally { setProcessing(false); }
  };

  const handleAgregarMovimiento = async () => {
    if (!sesionActiva) return;
    const monto = parseFloat(montoMovimiento);
    if (isNaN(monto) || monto <= 0) { alert("Ingrese un monto válido"); return; }
    if (!conceptoMovimiento.trim()) { alert("Ingrese un concepto"); return; }
    setProcessing(true);
    try {
      const response = await fetch(`/api/pos/caja/${sesionActiva.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "movimiento", tipo: tipoMovimiento, monto, concepto: conceptoMovimiento }),
      });
      const data = await response.json();
      if (data.success) {
        setShowMovimientoModal(false); setMontoMovimiento(""); setConceptoMovimiento("");
        fetchMovimientos(sesionActiva.id); fetchSesionActiva();
      } else { alert(data.error || "Error al agregar movimiento"); }
    } catch (error) {
      console.error("Error adding movimiento:", error); alert("Error al agregar movimiento");
    } finally { setProcessing(false); }
  };

  if (!user || !["admin", "vendedor", "super_admin"].includes(user.role)) return null;

  if (loadingSesion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center" style={{ color: "var(--color-text-muted)" }}>Cargando...</div>
      </div>
    );
  }

  const labelStyle = { color: "var(--color-text-secondary)" };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Gestión de Caja
        </h1>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
          Administra turnos de caja, movimientos y corte de caja
        </p>
      </div>

      {/* Sesión Actual */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Sesión Actual
          </h2>
          <div className="flex gap-2">
            {sesionActiva && (
              <Button variant="secondary" onClick={() => router.push("/dashboard/pos")}>
                Ir al POS →
              </Button>
            )}
            {!sesionActiva && (
              <Button onClick={() => setShowAbrirModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Abrir Caja
              </Button>
            )}
          </div>
        </div>

        {sesionActiva ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg" style={{ background: "var(--color-info-bg)" }}>
                <p className="text-sm" style={labelStyle}>Folio</p>
                <p className="text-lg font-bold" style={{ color: "var(--color-info)", fontFamily: "var(--font-mono)" }}>
                  {sesionActiva.folio}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ background: "var(--color-success-bg)" }}>
                <p className="text-sm" style={labelStyle}>Monto Inicial</p>
                <p className="text-lg font-bold" style={{ color: "var(--color-success)", fontFamily: "var(--font-data)" }}>
                  ${sesionActiva.montoInicial.toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ background: "var(--color-accent-light)" }}>
                <p className="text-sm" style={labelStyle}>Tiempo Abierto</p>
                <p className="text-lg font-bold" style={{ color: "var(--color-accent)", fontFamily: "var(--font-data)" }}>
                  {Math.floor((Date.now() - new Date(sesionActiva.fechaApertura).getTime()) / (1000 * 60 * 60))}h
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { setTipoMovimiento("deposito"); setShowMovimientoModal(true); }}>
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Depósito
              </Button>
              <Button variant="secondary" onClick={() => { setTipoMovimiento("retiro"); setShowMovimientoModal(true); }}>
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Retiro
              </Button>
              <Button variant="danger" onClick={() => setShowCerrarModal(true)}>
                <XCircle className="w-4 h-4 mr-2" />
                Cerrar Caja
              </Button>
            </div>

            {movimientos.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                  Movimientos
                </h3>
                <div className="space-y-2">
                  {movimientos.map((mov) => (
                    <div
                      key={mov.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: "var(--color-bg-elevated)" }}
                    >
                      <div className="flex items-center gap-3">
                        {mov.tipo === "deposito" ? (
                          <ArrowUpCircle className="w-5 h-5" style={{ color: "var(--color-success)" }} />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5" style={{ color: "var(--color-danger)" }} />
                        )}
                        <div>
                          <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{mov.concepto}</p>
                          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                            {new Date(mov.createdAt).toLocaleString("es-MX")}
                          </p>
                        </div>
                      </div>
                      <p
                        className="text-lg font-bold"
                        style={{
                          color: mov.tipo === "deposito" ? "var(--color-success)" : "var(--color-danger)",
                          fontFamily: "var(--font-data)",
                        }}
                      >
                        {mov.tipo === "deposito" ? "+" : "-"}${mov.monto.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay sesión de caja activa</p>
            <p className="text-sm mt-2">Abre una caja para comenzar a operar</p>
          </div>
        )}
      </Card>

      {/* Historial */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
          Historial de Sesiones
        </h2>
        <div className="space-y-3">
          {sesiones.map((sesion) => (
            <div key={sesion.id} className="rounded-lg p-4" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                      {sesion.folio}
                    </p>
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={
                        sesion.estado === "abierta"
                          ? { background: "var(--color-success-bg)", color: "var(--color-success-text)" }
                          : { background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }
                      }
                    >
                      {sesion.estado === "abierta" ? "Abierta" : "Cerrada"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p style={labelStyle}>Apertura</p>
                      <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {new Date(sesion.fechaApertura).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                    <div>
                      <p style={labelStyle}>Monto Inicial</p>
                      <p className="font-medium" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                        ${sesion.montoInicial.toFixed(2)}
                      </p>
                    </div>
                    {sesion.estado === "cerrada" && sesion.montoFinal && (
                      <>
                        <div>
                          <p style={labelStyle}>Monto Final</p>
                          <p className="font-medium" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                            ${sesion.montoFinal.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p style={labelStyle}>Diferencia</p>
                          <p
                            className="font-bold"
                            style={{
                              color: (sesion.diferencia || 0) === 0
                                ? "var(--color-success)"
                                : (sesion.diferencia || 0) > 0
                                ? "var(--color-info)"
                                : "var(--color-danger)",
                              fontFamily: "var(--font-data)",
                            }}
                          >
                            {sesion.diferencia && sesion.diferencia !== 0
                              ? `${sesion.diferencia > 0 ? "+" : ""}$${sesion.diferencia.toFixed(2)}`
                              : "Sin diferencia"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal Abrir Caja */}
      {showAbrirModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Abrir Caja</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Monto Inicial *
                </label>
                <Input type="number" step="0.01" min="0" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Notas (opcional)
                </label>
                <Input value={notasApertura} onChange={(e) => setNotasApertura(e.target.value)} placeholder="Ej: Turno matutino" />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowAbrirModal(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleAbrirCaja} disabled={processing || !montoInicial} className="flex-1">
                  {processing ? "Abriendo..." : "Abrir Caja"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Cerrar Caja */}
      {showCerrarModal && sesionActiva && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>Corte de Caja</h2>

            {/* Resumen */}
            <div className="rounded-lg p-4 mb-4 space-y-2 text-sm" style={{ background: "var(--color-bg-elevated)" }}>
              {[
                { label: "Monto Inicial:", value: `$${sesionActiva.montoInicial.toFixed(2)}`, color: "var(--color-text-primary)" },
                { label: "Ventas Efectivo:", value: `+$${sesionActiva.totalVentasEfectivo.toFixed(2)}`, color: "var(--color-success)" },
                { label: "Depósitos:", value: `+$${sesionActiva.totalDepositos.toFixed(2)}`, color: "var(--color-success)" },
                { label: "Retiros:", value: `-$${sesionActiva.totalRetiros.toFixed(2)}`, color: "var(--color-danger)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
                  <span className="font-medium" style={{ color, fontFamily: "var(--font-data)" }}>{value}</span>
                </div>
              ))}
              <div className="pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
                <div className="flex justify-between">
                  <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Monto Esperado:</span>
                  <span className="font-bold" style={{ color: "var(--color-accent)", fontFamily: "var(--font-data)" }}>
                    ${(sesionActiva.montoInicial + sesionActiva.totalVentasEfectivo + sesionActiva.totalDepositos - sesionActiva.totalRetiros).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Monto Final (Efectivo en Caja) *
                </label>
                <Input type="number" step="0.01" min="0" value={montoFinal} onChange={(e) => setMontoFinal(e.target.value)} placeholder="0.00" />
              </div>

              {montoFinal && (
                <div className="p-3 rounded-lg" style={{
                  background: parseFloat(montoFinal) - (sesionActiva.montoInicial + sesionActiva.totalVentasEfectivo + sesionActiva.totalDepositos - sesionActiva.totalRetiros) === 0
                    ? "var(--color-success-bg)"
                    : "var(--color-warning-bg)",
                }}>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    Diferencia:{" "}
                    <span className="font-bold" style={{ fontFamily: "var(--font-data)" }}>
                      ${(parseFloat(montoFinal) - (sesionActiva.montoInicial + sesionActiva.totalVentasEfectivo + sesionActiva.totalDepositos - sesionActiva.totalRetiros)).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}

              {/* Payjoy Stats */}
              {payjoyStats ? (
                <div className="p-4 rounded-lg" style={{ background: "var(--color-info-bg)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--color-info)" }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--color-info-text)" }}>
                        Payjoy — Solo informativo
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-info)" }}>
                        Este dinero NO está en caja física · Procesado por Payjoy
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded p-2 text-center" style={{ background: "var(--color-bg-surface)" }}>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Pagos recibidos</p>
                      <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                        {payjoyStats.totalPagosPayjoy}
                      </p>
                    </div>
                    <div className="rounded p-2 text-center" style={{ background: "var(--color-bg-surface)" }}>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Total Payjoy</p>
                      <p className="text-lg font-bold" style={{ color: "var(--color-info)", fontFamily: "var(--font-data)" }}>
                        ${payjoyStats.montoTotalPayjoy.toLocaleString("es-MX")}
                      </p>
                    </div>
                  </div>
                  {payjoyStats.desglosePagos.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr style={{ background: "var(--color-info-bg)" }}>
                            {["TX ID", "Cliente", "Monto", "Método", "Hora"].map((h, i) => (
                              <th key={h} className={`px-2 py-1 font-medium ${i === 2 ? "text-right" : "text-left"}`} style={{ color: "var(--color-info-text)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                          {payjoyStats.desglosePagos.map((pago) => (
                            <tr key={pago.pagoId} style={{ background: "var(--color-bg-surface)", borderBottom: "1px solid var(--color-border-subtle)" }}>
                              <td className="px-2 py-1 font-mono" style={{ color: "var(--color-text-muted)" }}>
                                {pago.transactionId !== "N/A" ? `${pago.transactionId.substring(0, 8)}…` : "N/A"}
                              </td>
                              <td className="px-2 py-1" style={{ color: "var(--color-text-primary)" }}>{pago.clienteNombre}</td>
                              <td className="px-2 py-1 text-right font-medium" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                                ${pago.monto.toLocaleString("es-MX")}
                              </td>
                              <td className="px-2 py-1">
                                <span className="px-1.5 py-0.5 rounded text-xs" style={
                                  pago.payjoyPaymentMethod === "cash"
                                    ? { background: "var(--color-success-bg)", color: "var(--color-success-text)" }
                                    : pago.payjoyPaymentMethod === "card"
                                    ? { background: "var(--color-accent-light)", color: "var(--color-accent)" }
                                    : pago.payjoyPaymentMethod === "transfer"
                                    ? { background: "var(--color-info-bg)", color: "var(--color-info-text)" }
                                    : { background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }
                                }>
                                  {pago.payjoyPaymentMethod === "cash" ? "Efectivo" : pago.payjoyPaymentMethod === "card" ? "Tarjeta" : pago.payjoyPaymentMethod === "transfer" ? "Transfer." : pago.payjoyPaymentMethod}
                                </span>
                              </td>
                              <td className="px-2 py-1" style={{ color: "var(--color-text-muted)" }}>
                                {new Date(pago.hora).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg flex items-start gap-3" style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)" }}>
                  <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-warning)" }} />
                  <p className="text-xs" style={{ color: "var(--color-warning-text)" }}>
                    <span className="font-medium">Pagos Payjoy</span> — Los pagos recibidos vía Payjoy se registran automáticamente y se mostrarán aquí al cerrar.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  Notas de Cierre (opcional)
                </label>
                <Input value={notasCierre} onChange={(e) => setNotasCierre(e.target.value)} placeholder="Observaciones del turno" />
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowCerrarModal(false)} className="flex-1">Cancelar</Button>
                <Button variant="danger" onClick={handleCerrarCaja} disabled={processing || !montoFinal} className="flex-1">
                  {processing ? "Cerrando..." : "Cerrar Caja"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Movimiento */}
      {showMovimientoModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
              {tipoMovimiento === "deposito" ? "Agregar Depósito" : "Agregar Retiro"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Monto *</label>
                <Input type="number" step="0.01" min="0.01" value={montoMovimiento} onChange={(e) => setMontoMovimiento(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Concepto *</label>
                <Input
                  value={conceptoMovimiento}
                  onChange={(e) => setConceptoMovimiento(e.target.value)}
                  placeholder={tipoMovimiento === "deposito" ? "Ej: Depósito bancario" : "Ej: Pago a proveedor"}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowMovimientoModal(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleAgregarMovimiento} disabled={processing || !montoMovimiento || !conceptoMovimiento.trim()} className="flex-1">
                  {processing ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
