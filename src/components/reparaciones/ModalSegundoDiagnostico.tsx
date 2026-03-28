"use client";

/**
 * FASE 56: Modal para registrar un nuevo problema encontrado durante la reparación.
 * Regla de negocio crítica: el cliente DEBE aprobar antes de instalar cualquier pieza
 * del segundo diagnóstico. Esta política debe quedar en el contrato.
 *
 * Flujo:
 *  1. Técnico llena: problema encontrado, diagnóstico, costo adicional
 *  2. Elige cómo notificar al cliente (presencial o WA)
 *  3. Si presencial: registra la respuesta inmediatamente
 *  4. Si WA: genera link/mensaje WA para que el cliente responda
 *  5. Una vez aprobado → el costo total de la orden se actualiza
 *  6. Si rechazado → se continúa solo con el diagnóstico original
 *  7. Si cancela todo → se inicia flujo de cancelación completa
 */

import { useState } from "react";
import {
  AlertTriangle, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, MessageCircle, Phone, Send,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { OrdenReparacionDetallada, ReparacionDiagnostico } from "@/types";

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface PiezaNecesaria {
  nombre: string;
  cantidad: number;
  costo: number;
}

type PasoModal = "formulario" | "aprobacion" | "resultado";
type DecisionCliente = "aprobado" | "rechazado" | "cancelado_todo" | null;
type TipoAprobacion = "presencial" | "whatsapp";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModalSegundoDiagnosticoProps {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenReparacionDetallada;
  onCreado: (diagnostico: ReparacionDiagnostico) => void;
  onCancelarTodo?: () => void; // callback si el cliente cancela todo
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMXN(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ModalSegundoDiagnostico({
  isOpen,
  onClose,
  orden,
  onCreado,
  onCancelarTodo,
}: ModalSegundoDiagnosticoProps) {
  // ── Formulario ─────────────────────────────────────────────────────────────
  const [paso, setPaso] = useState<PasoModal>("formulario");
  const [descripcionProblema, setDescripcionProblema] = useState("");
  const [diagnosticoTecnico, setDiagnosticoTecnico] = useState("");
  const [costoLabor, setCostoLabor] = useState("");
  const [costoPartes, setCostoPartes] = useState("");
  const [notas, setNotas] = useState("");
  const [piezas, setPiezas] = useState<PiezaNecesaria[]>([]);
  const [mostrarPiezas, setMostrarPiezas] = useState(false);

  // ── Aprobación ─────────────────────────────────────────────────────────────
  const [tipoAprobacion, setTipoAprobacion] = useState<TipoAprobacion>("presencial");
  const [decision, setDecision] = useState<DecisionCliente>(null);
  const [diagnosticoCreado, setDiagnosticoCreado] = useState<ReparacionDiagnostico | null>(null);

  // ── Estado de carga ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Cálculos ───────────────────────────────────────────────────────────────
  const costoLaborN = parseFloat(costoLabor || "0") || 0;
  const costoPartesN = parseFloat(costoPartes || "0") || 0;
  const costoAdicional = costoLaborN + costoPartesN;
  const costoTotalNuevo = orden.costoTotal + costoAdicional;

  // ── Mensaje WhatsApp ───────────────────────────────────────────────────────
  function generarMensajeWA() {
    const nombre = orden.clienteNombre;
    const equipo = `${orden.marcaDispositivo} ${orden.modeloDispositivo}`;
    const folio = orden.folio;
    const costoStr = costoAdicional > 0 ? `\n💰 *Costo adicional:* ${fmtMXN(costoAdicional)}` : "";
    const costoTotalStr = costoAdicional > 0 ? `\n💰 *Nuevo total:* ${fmtMXN(costoTotalNuevo)}` : "";

    return (
      `Hola ${nombre} 👋\n\n` +
      `Al revisar tu ${equipo} (${folio}), encontramos un problema adicional:\n\n` +
      `🔍 *${descripcionProblema}*\n` +
      (diagnosticoTecnico ? `\n📋 ${diagnosticoTecnico}` : "") +
      costoStr +
      costoTotalStr +
      `\n\n*¿Deseas que procedamos con esta reparación adicional?*\n` +
      `• Responde ✅ para APROBAR\n` +
      `• Responde ❌ para cancelar solo este servicio\n` +
      `• Responde ⛔ para cancelar todo\n\n` +
      `Política: *No instalamos piezas sin tu autorización previa.*`
    );
  }

  function abrirWA() {
    const tel = orden.clienteTelefono.replace(/\D/g, "");
    const numero = tel.startsWith("52") ? tel : `52${tel}`;
    const texto = encodeURIComponent(generarMensajeWA());
    window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
  }

  // ── Paso 1: crear el diagnóstico en BD ────────────────────────────────────
  async function handleCrearDiagnostico() {
    if (!descripcionProblema.trim()) {
      setError("Describe el problema encontrado");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reparaciones/${orden.id}/diagnosticos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcionProblema: descripcionProblema.trim(),
          diagnosticoTecnico: diagnosticoTecnico.trim() || undefined,
          costoLabor: costoLaborN,
          costoPartes: costoPartesN,
          partesNecesarias: piezas,
          notas: notas.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al guardar");
      setDiagnosticoCreado(data.data);
      setPaso("aprobacion");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar el diagnóstico");
    } finally {
      setLoading(false);
    }
  }

  // ── Paso 2: registrar decisión del cliente ────────────────────────────────
  async function handleRegistrarDecision(d: "aprobado" | "rechazado" | "cancelado_todo") {
    if (!diagnosticoCreado) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/reparaciones/${orden.id}/diagnosticos/${diagnosticoCreado.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: d, tipoAprobacion }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al registrar decisión");

      setDecision(d);
      setPaso("resultado");

      if (d === "aprobado") {
        onCreado(data.data);
      } else if (d === "cancelado_todo" && onCancelarTodo) {
        // Notificar al padre para que abra el flujo de cancelación
        onCancelarTodo();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar decisión");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    // Reset todo al cerrar
    setPaso("formulario");
    setDescripcionProblema("");
    setDiagnosticoTecnico("");
    setCostoLabor("");
    setCostoPartes("");
    setNotas("");
    setPiezas([]);
    setMostrarPiezas(false);
    setTipoAprobacion("presencial");
    setDecision(null);
    setDiagnosticoCreado(null);
    setError("");
    onClose();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo problema encontrado"
      size="lg"
    >
      <div className="space-y-4">

        {/* ─── AVISO DE POLÍTICA ─── */}
        <div
          className="flex gap-3 rounded-xl p-3"
          style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-warning)" }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--color-warning-text)" }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--color-warning-text)" }}>
              Política obligatoria
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-warning-text)" }}>
              El cliente debe aprobar este diagnóstico <strong>antes de instalar cualquier pieza</strong>.
              Esta política está en el contrato de servicio.
            </p>
          </div>
        </div>

        {/* ─── PASO 1: FORMULARIO ─── */}
        {paso === "formulario" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Problema encontrado *
              </label>
              <textarea
                rows={2}
                value={descripcionProblema}
                onChange={(e) => { setDescripcionProblema(e.target.value); setError(""); }}
                placeholder="Ej: Conector de carga dañado, requiere reemplazo de placa base"
                className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                style={{
                  background: "var(--color-bg-sunken)",
                  border: `1px solid ${error && !descripcionProblema ? "var(--color-danger)" : "var(--color-border)"}`,
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-border-strong)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Diagnóstico técnico (opcional)
              </label>
              <textarea
                rows={2}
                value={diagnosticoTecnico}
                onChange={(e) => setDiagnosticoTecnico(e.target.value)}
                placeholder="Descripción técnica detallada del problema y la solución"
                className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                style={{
                  background: "var(--color-bg-sunken)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              />
            </div>

            {/* Costos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Costo mano de obra adicional
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--color-text-muted)" }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={costoLabor}
                    onChange={(e) => setCostoLabor(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2 rounded-xl text-sm"
                    style={{
                      background: "var(--color-bg-sunken)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-data)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Costo piezas adicionales
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--color-text-muted)" }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={costoPartes}
                    onChange={(e) => setCostoPartes(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2 rounded-xl text-sm"
                    style={{
                      background: "var(--color-bg-sunken)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-data)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Resumen de costo si hay valores */}
            {costoAdicional > 0 && (
              <div
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
              >
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Costo original</p>
                  <p className="text-sm font-mono" style={{ color: "var(--color-text-secondary)" }}>{fmtMXN(orden.costoTotal)}</p>
                </div>
                <span className="text-lg" style={{ color: "var(--color-text-muted)" }}>+</span>
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Adicional</p>
                  <p className="text-sm font-mono font-semibold" style={{ color: "var(--color-warning-text)" }}>{fmtMXN(costoAdicional)}</p>
                </div>
                <span className="text-lg" style={{ color: "var(--color-text-muted)" }}>=</span>
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Nuevo total</p>
                  <p className="text-base font-mono font-bold" style={{ color: "var(--color-text-primary)" }}>{fmtMXN(costoTotalNuevo)}</p>
                </div>
              </div>
            )}

            {/* Piezas (opcional, colapsable) */}
            <div>
              <button
                type="button"
                onClick={() => setMostrarPiezas((v) => !v)}
                className="flex items-center gap-2 text-xs font-medium"
                style={{ color: "var(--color-accent)" }}
              >
                {mostrarPiezas ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {mostrarPiezas ? "Ocultar piezas" : "Agregar piezas necesarias (opcional)"}
              </button>
              {mostrarPiezas && (
                <div className="mt-2 space-y-2">
                  {piezas.map((pieza, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={pieza.nombre}
                        onChange={(e) => {
                          const copia = [...piezas];
                          copia[idx].nombre = e.target.value;
                          setPiezas(copia);
                        }}
                        placeholder="Nombre de la pieza"
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs"
                        style={{ background: "var(--color-bg-sunken)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", outline: "none" }}
                      />
                      <input
                        type="number"
                        min="1"
                        value={pieza.cantidad}
                        onChange={(e) => {
                          const copia = [...piezas];
                          copia[idx].cantidad = parseInt(e.target.value) || 1;
                          setPiezas(copia);
                        }}
                        className="w-12 px-2 py-1.5 rounded-lg text-xs text-center"
                        style={{ background: "var(--color-bg-sunken)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", outline: "none" }}
                      />
                      <button
                        type="button"
                        onClick={() => setPiezas(piezas.filter((_, i) => i !== idx))}
                        className="text-xs px-2 py-1.5 rounded-lg"
                        style={{ color: "var(--color-danger)", background: "var(--color-danger-bg)" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPiezas([...piezas, { nombre: "", cantidad: 1, costo: 0 }])}
                    className="text-xs font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    + Agregar pieza
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Notas internas (opcionales)
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas para el equipo interno"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={{ background: "var(--color-bg-sunken)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", outline: "none" }}
              />
            </div>

            {error && (
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCrearDiagnostico}
                disabled={loading || !descripcionProblema.trim()}
                className="flex-1"
              >
                {loading ? "Guardando…" : "Continuar →"}
              </Button>
            </div>
          </>
        )}

        {/* ─── PASO 2: NOTIFICAR AL CLIENTE ─── */}
        {paso === "aprobacion" && diagnosticoCreado && (
          <>
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>Diagnóstico guardado</p>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{descripcionProblema}</p>
              {costoAdicional > 0 && (
                <p className="text-xs mt-1 font-mono" style={{ color: "var(--color-warning-text)" }}>
                  Costo adicional: {fmtMXN(costoAdicional)} → Nuevo total: {fmtMXN(costoTotalNuevo)}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                ¿Cómo aprueba el cliente?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTipoAprobacion("presencial")}
                  className="flex items-center gap-2 rounded-xl p-3 text-sm font-medium transition-all"
                  style={{
                    background: tipoAprobacion === "presencial" ? "var(--color-primary)" : "var(--color-bg-elevated)",
                    color: tipoAprobacion === "presencial" ? "#fff" : "var(--color-text-secondary)",
                    border: `2px solid ${tipoAprobacion === "presencial" ? "var(--color-primary)" : "var(--color-border)"}`,
                  }}
                >
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  Está aquí (presencial)
                </button>
                <button
                  onClick={() => setTipoAprobacion("whatsapp")}
                  className="flex items-center gap-2 rounded-xl p-3 text-sm font-medium transition-all"
                  style={{
                    background: tipoAprobacion === "whatsapp" ? "var(--color-success)" : "var(--color-bg-elevated)",
                    color: tipoAprobacion === "whatsapp" ? "#fff" : "var(--color-text-secondary)",
                    border: `2px solid ${tipoAprobacion === "whatsapp" ? "var(--color-success)" : "var(--color-border)"}`,
                  }}
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  Por WhatsApp
                </button>
              </div>
            </div>

            {/* Presencial: botones de decisión inmediata */}
            {tipoAprobacion === "presencial" && (
              <div className="space-y-2">
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Explícale al cliente el problema y registra su decisión:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleRegistrarDecision("aprobado")}
                    disabled={loading}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold transition-all"
                    style={{ background: "var(--color-success)", color: "#fff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Aprueba
                  </button>
                  <button
                    onClick={() => handleRegistrarDecision("rechazado")}
                    disabled={loading}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold transition-all"
                    style={{ background: "var(--color-warning-bg)", color: "var(--color-warning-text)", border: "1px solid var(--color-warning)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <XCircle className="w-5 h-5" />
                    Solo primer serv.
                  </button>
                  <button
                    onClick={() => handleRegistrarDecision("cancelado_todo")}
                    disabled={loading}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold transition-all"
                    style={{ background: "var(--color-danger-bg)", color: "var(--color-danger-text)", border: "1px solid var(--color-danger)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <XCircle className="w-5 h-5" />
                    Cancela todo
                  </button>
                </div>
                {loading && <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>Registrando…</p>}
                {error && <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}
              </div>
            )}

            {/* WhatsApp: enviar mensaje y esperar */}
            {tipoAprobacion === "whatsapp" && (
              <div className="space-y-3">
                <div
                  className="rounded-xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line"
                  style={{ background: "var(--color-bg-sunken)", border: "1px solid var(--color-border-subtle)", color: "var(--color-text-secondary)" }}
                >
                  {generarMensajeWA()}
                </div>
                <button
                  onClick={abrirWA}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
                  style={{ background: "var(--color-success)", color: "#fff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <Send className="w-4 h-4" />
                  Abrir WhatsApp
                </button>
                <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                  Cuando el cliente responda, registra su decisión:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleRegistrarDecision("aprobado")}
                    disabled={loading}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-xs font-semibold"
                    style={{ background: "var(--color-success)", color: "#fff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ✅ Aprobó
                  </button>
                  <button
                    onClick={() => handleRegistrarDecision("rechazado")}
                    disabled={loading}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-xs font-semibold"
                    style={{ background: "var(--color-warning-bg)", color: "var(--color-warning-text)", border: "1px solid var(--color-warning)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <XCircle className="w-4 h-4" />
                    ❌ Rechazó
                  </button>
                  <button
                    onClick={() => handleRegistrarDecision("cancelado_todo")}
                    disabled={loading}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-xs font-semibold"
                    style={{ background: "var(--color-danger-bg)", color: "var(--color-danger-text)", border: "1px solid var(--color-danger)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <XCircle className="w-4 h-4" />
                    ⛔ Cancela
                  </button>
                </div>
                {error && <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}
              </div>
            )}
          </>
        )}

        {/* ─── PASO 3: RESULTADO ─── */}
        {paso === "resultado" && decision && (
          <div className="text-center py-4 space-y-3">
            {decision === "aprobado" && (
              <>
                <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: "var(--color-success)" }} />
                <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  ¡Aprobado! Puedes proceder.
                </p>
                {costoAdicional > 0 && (
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    El costo total se ha actualizado a <strong className="font-mono">{fmtMXN(costoTotalNuevo)}</strong>
                  </p>
                )}
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Recuerda: instala las piezas solo ahora que está aprobado.
                </p>
              </>
            )}
            {decision === "rechazado" && (
              <>
                <XCircle className="w-12 h-12 mx-auto" style={{ color: "var(--color-warning-text)" }} />
                <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Cliente rechazó el segundo servicio
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Continúa solo con el diagnóstico original. El costo no cambia.
                </p>
              </>
            )}
            {decision === "cancelado_todo" && (
              <>
                <XCircle className="w-12 h-12 mx-auto" style={{ color: "var(--color-danger)" }} />
                <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Cliente canceló todo
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Se abrirá el flujo de cancelación completo.
                </p>
              </>
            )}
            <Button variant="primary" onClick={handleClose} className="w-full mt-2">
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
