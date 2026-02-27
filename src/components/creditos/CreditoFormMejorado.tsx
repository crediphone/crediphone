"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectorProductos } from "./SelectorProductos";
import type { Credito, Cliente, Producto } from "@/types";
import {
  calcularCredito,
  generarTablaAmortizacion,
  formatearMoneda,
  formatearFecha,
  obtenerOpcionesTasas,
  obtenerOpcionesEnganche,
  type CalculoCreditoParams,
  type ResultadoCalculo,
  type PagoAmortizacion,
} from "@/lib/calculosCredito";

interface ProductoSeleccionado extends Producto {
  cantidad: number;
}

interface CreditoFormMejoradoProps {
  mode: "create" | "edit";
  credito: Credito | null;
  clientes: Cliente[];
  onSuccess: () => void;
  onCancel: () => void;
}

// ─── Estilos reutilizables ────────────────────────────────────────────────────
const labelStyle = { color: "var(--color-text-secondary)", display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" };
const selectSt = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid var(--color-border)",
  borderRadius: "0.375rem",
  background: "var(--color-bg-sunken)",
  color: "var(--color-text-primary)",
  outline: "none",
};
const hintSt = { color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "0.25rem" };
const errorSt = { color: "var(--color-danger)", fontSize: "0.75rem", marginTop: "0.25rem" };
const sectionSt = { borderTop: "1px solid var(--color-border)", paddingTop: "1rem" };

export function CreditoFormMejorado({
  mode,
  credito,
  clientes,
  onSuccess,
  onCancel,
}: CreditoFormMejoradoProps) {
  const [formData, setFormData] = useState({
    clienteId: credito?.clienteId || "",
    enganchePorcentaje: credito?.enganchePorcentaje?.toString() || "10",
    plazo: credito?.plazo?.toString() || "12",
    tasaInteresBase: "20",
    frecuenciaPago: (credito?.frecuenciaPago || "quincenal") as "semanal" | "quincenal" | "mensual",
    fechaInicio: credito?.fechaInicio
      ? new Date(credito.fechaInicio).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    estado: credito?.estado || "activo",
    vendedorId: credito?.vendedorId || "00000000-0000-0000-0000-000000000000",
  });

  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
  const [montoTotalProductos, setMontoTotalProductos] = useState(0);
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [tablaAmortizacion, setTablaAmortizacion] = useState<PagoAmortizacion[]>([]);
  const [mostrarTabla, setMostrarTabla] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tieneCelularActivo, setTieneCelularActivo] = useState(false);

  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [tipoFirma, setTipoFirma] = useState<"manuscrita" | "digital">("digital");
  const [firmaDigital, setFirmaDigital] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [firmaValida, setFirmaValida] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const opcionesTasas = obtenerOpcionesTasas();
  const opcionesEnganche = obtenerOpcionesEnganche(true, false);

  const esCelular = (producto: Producto): boolean => {
    const nombreLower = producto.nombre.toLowerCase();
    const palabrasClave = ['celular', 'iphone', 'galaxy', 'smartphone', 'teléfono', 'telefono', 'móvil', 'movil', 'xiaomi', 'huawei', 'motorola', 'nokia'];
    return palabrasClave.some(palabra => nombreLower.includes(palabra));
  };

  useEffect(() => {
    const verificarCelularActivo = async () => {
      if (!formData.clienteId) return;
      try {
        const response = await fetch(`/api/creditos?clienteId=${formData.clienteId}`);
        const data = await response.json();
        if (data.success && data.data) {
          const creditosActivos = data.data.filter((c: any) => c.estado === 'activo' && c.productos_ids);
          setTieneCelularActivo(creditosActivos.length > 0);
        }
      } catch (error) {
        console.error('Error al verificar celulares activos:', error);
      }
    };
    verificarCelularActivo();
  }, [formData.clienteId]);

  useEffect(() => {
    if (
      montoTotalProductos > 0 &&
      formData.enganchePorcentaje &&
      formData.plazo &&
      formData.tasaInteresBase &&
      formData.fechaInicio
    ) {
      try {
        const params: CalculoCreditoParams = {
          montoOriginal: montoTotalProductos,
          enganchePorcentaje: Number(formData.enganchePorcentaje),
          plazo: Number(formData.plazo),
          tasaInteresBase: Number(formData.tasaInteresBase),
          frecuenciaPago: formData.frecuenciaPago,
        };
        const calc = calcularCredito(params);
        setResultado(calc);
        const tabla = generarTablaAmortizacion(params, new Date(formData.fechaInicio));
        setTablaAmortizacion(tabla);
      } catch (error) {
        console.error("Error en cálculos:", error);
        setResultado(null);
        setTablaAmortizacion([]);
      }
    }
  }, [montoTotalProductos, formData.enganchePorcentaje, formData.plazo, formData.tasaInteresBase, formData.frecuenciaPago, formData.fechaInicio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && tipoFirma === "manuscrita") {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [tipoFirma]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleProductosChange = (productos: ProductoSeleccionado[], total: number) => {
    const tieneCelularEnCarrito = productos.some(p => esCelular(p));
    if (tieneCelularActivo && tieneCelularEnCarrito && mode === "create") {
      setErrors(prev => ({ ...prev, productos: "⚠️ El cliente ya tiene un crédito activo con celular. Debe liquidarlo antes de adquirir otro." }));
      return;
    }
    setProductosSeleccionados(productos);
    setMontoTotalProductos(total);
    if (errors.productos) {
      setErrors(prev => { const { productos, ...rest } = prev; return rest; });
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setFirmaValida(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFirmaValida(false);
  };

  const handleFirmaDigitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setFirmaDigital(valor);
    setFirmaValida(valor.trim().length >= 5);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clienteId) newErrors.clienteId = "Selecciona un cliente";
    if (productosSeleccionados.length === 0 || montoTotalProductos <= 0)
      newErrors.productos = "Debes agregar al menos un producto";
    if (!formData.plazo || Number(formData.plazo) <= 0) newErrors.plazo = "El plazo debe ser mayor a 0";
    if (!formData.fechaInicio) newErrors.fechaInicio = "La fecha de inicio es requerida";
    if (!aceptaTerminos) newErrors.terminos = "Debes aceptar los términos y condiciones";
    if (!firmaValida) newErrors.firma = "Debes firmar el contrato";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !resultado) return;
    setLoading(true);
    try {
      const url = mode === "create" ? "/api/creditos" : `/api/creditos/${credito?.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const fechaInicio = new Date(formData.fechaInicio);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaFin.getMonth() + Number(formData.plazo));
      let firmaData = "";
      if (tipoFirma === "manuscrita") {
        const canvas = canvasRef.current;
        if (canvas) firmaData = canvas.toDataURL("image/png");
      } else {
        firmaData = firmaDigital;
      }
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: formData.clienteId,
          montoOriginal: montoTotalProductos,
          enganche: resultado.montoEnganche,
          enganchePorcentaje: Number(formData.enganchePorcentaje),
          monto: resultado.montoFinanciar,
          plazo: Number(formData.plazo),
          tasaInteres: resultado.tasaInteresAjustada,
          frecuenciaPago: formData.frecuenciaPago,
          montoPago: resultado.montoPorPago,
          pagoQuincenal: resultado.montoPorPago,
          fechaInicio: formData.fechaInicio,
          fechaFin: fechaFin.toISOString().split("T")[0],
          estado: formData.estado,
          vendedorId: formData.vendedorId,
          diasMora: 0,
          montoMora: 0,
          tasaMoraDiaria: 50,
          productosIds: productosSeleccionados.map((p) => p.id),
          firmaCliente: firmaData,
          tipoFirma,
          fechaFirma: new Date().toISOString(),
        }),
      });
      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        console.error("Error:", data);
      }
    } catch (error) {
      console.error("Error al guardar crédito:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[85vh] overflow-y-auto px-1 pb-4">
      {/* Selección de Cliente */}
      <div>
        <label style={labelStyle}>
          Cliente <span style={{ color: "var(--color-danger)" }}>*</span>
        </label>
        <select name="clienteId" value={formData.clienteId} onChange={handleChange} style={selectSt} required>
          <option value="">Selecciona un cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre} {cliente.apellido} - {cliente.telefono}
            </option>
          ))}
        </select>
        {errors.clienteId && <p style={errorSt}>{errors.clienteId}</p>}
      </div>

      {/* Selector de Productos */}
      <div style={sectionSt}>
        <SelectorProductos onProductosChange={handleProductosChange} productosIniciales={[]} />
        {errors.productos && <p style={errorSt}>{errors.productos}</p>}
      </div>

      {/* Configuración del Crédito */}
      {montoTotalProductos > 0 && (
        <>
          <div style={sectionSt}>
            <h4 className="text-sm font-medium mb-3" style={{ color: "var(--color-text-primary)" }}>
              💰 Configuración del Crédito
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>
                  Porcentaje de Enganche <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <select name="enganchePorcentaje" value={formData.enganchePorcentaje} onChange={handleChange} style={selectSt} required>
                  {opcionesEnganche.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Fecha de Inicio"
                name="fechaInicio"
                type="date"
                value={formData.fechaInicio}
                onChange={handleChange}
                error={errors.fechaInicio}
                required
              />
            </div>
          </div>

          {/* Términos del Crédito */}
          <div style={sectionSt}>
            <h4 className="text-sm font-medium mb-3" style={{ color: "var(--color-text-primary)" }}>
              📅 Términos del Crédito
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label="Plazo (meses)"
                name="plazo"
                type="number"
                value={formData.plazo}
                onChange={handleChange}
                error={errors.plazo}
                placeholder="12"
                required
              />
              <div>
                <label style={labelStyle}>
                  Tasa de Interés Base <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <select name="tasaInteresBase" value={formData.tasaInteresBase} onChange={handleChange} style={selectSt} required>
                  {opcionesTasas.map((tasa) => (
                    <option key={tasa} value={tasa}>{tasa}%</option>
                  ))}
                </select>
                <p style={hintSt}>Se ajusta automáticamente según el plazo</p>
              </div>
              <div>
                <label style={labelStyle}>
                  Frecuencia de Pago <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <select name="frecuenciaPago" value={formData.frecuenciaPago} onChange={handleChange} style={selectSt} required>
                  <option value="semanal">Semanal (4 pagos/mes)</option>
                  <option value="quincenal">Quincenal (2 pagos/mes)</option>
                  <option value="mensual">Mensual (1 pago/mes)</option>
                </select>
                <p style={hintSt}>
                  Total: {formData.plazo} meses × {formData.frecuenciaPago === 'semanal' ? '4' : formData.frecuenciaPago === 'quincenal' ? '2' : '1'} = {resultado ? resultado.numeroPagos : '...'} pagos
                </p>
              </div>
            </div>
          </div>

          {/* Resumen Financiero */}
          {resultado && (
            <div style={sectionSt}>
              <h4 className="text-sm font-medium mb-3" style={{ color: "var(--color-text-primary)" }}>
                📊 Resumen Financiero
              </h4>
              <div
                className="rounded-lg p-3 md:p-4"
                style={{
                  background: "var(--color-info-bg)",
                  border: "1px solid var(--color-info)",
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-sm">
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Valor total productos:</span>
                    <div className="font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                      {formatearMoneda(montoTotalProductos)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Enganche ({formData.enganchePorcentaje}%):</span>
                    <div className="font-semibold" style={{ color: "var(--color-success)", fontFamily: "var(--font-data)" }}>
                      -{formatearMoneda(resultado.montoEnganche)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Monto a financiar:</span>
                    <div className="font-semibold" style={{ color: "var(--color-accent)", fontFamily: "var(--font-data)" }}>
                      {formatearMoneda(resultado.montoFinanciar)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Tasa aplicada:</span>
                    <div className="font-semibold" style={{ color: "var(--color-accent)", fontFamily: "var(--font-data)" }}>
                      {resultado.tasaInteresAjustada}%
                      {resultado.tasaInteresAjustada !== Number(formData.tasaInteresBase) && (
                        <span className="text-xs ml-1" style={{ color: "var(--color-text-muted)" }}>(ajustada por plazo)</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Interés total:</span>
                    <div className="font-semibold" style={{ color: "var(--color-warning)", fontFamily: "var(--font-data)" }}>
                      +{formatearMoneda(resultado.montoInteres)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Total a pagar:</span>
                    <div className="font-bold text-lg" style={{ color: "var(--color-danger)", fontFamily: "var(--font-data)" }}>
                      {formatearMoneda(resultado.montoTotalPagar)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 md:mt-4 pt-3 md:pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <div>
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        Pago por {formData.frecuenciaPago}:
                      </span>
                      <div className="font-bold text-xl" style={{ color: "var(--color-success)", fontFamily: "var(--font-data)" }}>
                        {formatearMoneda(resultado.montoPorPago)}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Número de pagos:</span>
                      <div className="font-semibold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                        {resultado.numeroPagos} pagos
                      </div>
                    </div>
                    <div>
                      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>CAT estimado:</span>
                      <div className="font-semibold" style={{ color: "var(--color-accent)", fontFamily: "var(--font-data)" }}>
                        {resultado.cat.toFixed(2)}%
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Costo Anual Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Amortización */}
          {resultado && tablaAmortizacion.length > 0 && (
            <div style={sectionSt}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  📋 Tabla de Amortización ({tablaAmortizacion.length} pagos)
                </h4>
                <Button type="button" variant="secondary" onClick={() => setMostrarTabla(!mostrarTabla)}>
                  {mostrarTabla ? "Ocultar" : "Ver Tabla"}
                </Button>
              </div>

              {mostrarTabla && (
                <div
                  className="max-h-96 overflow-auto rounded-lg"
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  <table className="w-full text-xs sm:text-sm min-w-[600px]">
                    <thead style={{ background: "var(--color-bg-elevated)", position: "sticky", top: 0 }}>
                      <tr>
                        {["#", "Fecha", "Pago", "Capital", "Interés", "Saldo"].map((h, i) => (
                          <th
                            key={h}
                            className={`px-3 py-2 text-xs font-medium uppercase ${i >= 2 ? "text-right" : "text-left"}`}
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tablaAmortizacion.map((pago) => (
                        <tr
                          key={pago.numero}
                          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-elevated)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td className="px-3 py-2" style={{ color: "var(--color-text-primary)" }}>{pago.numero}</td>
                          <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--color-text-secondary)" }}>
                            {formatearFecha(pago.fecha)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                            {formatearMoneda(pago.montoPago)}
                          </td>
                          <td className="px-3 py-2 text-right" style={{ color: "var(--color-accent)", fontFamily: "var(--font-data)" }}>
                            {formatearMoneda(pago.capital)}
                          </td>
                          <td className="px-3 py-2 text-right" style={{ color: "var(--color-warning)", fontFamily: "var(--font-data)" }}>
                            {formatearMoneda(pago.interes)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}>
                            {formatearMoneda(pago.saldoPendiente)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Términos y Condiciones */}
          {resultado && (
            <div style={sectionSt}>
              <h4 className="text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
                ⚖️ Términos y Condiciones
              </h4>
              <div
                className="rounded-md p-3 text-xs space-y-2 max-h-60 overflow-y-auto"
                style={{
                  background: "var(--color-warning-bg)",
                  border: "1px solid var(--color-warning)",
                  color: "var(--color-warning-text)",
                }}
              >
                <p><strong>1. OBLIGACIONES DEL ACREDITADO:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Realizar los pagos en las fechas establecidas según la frecuencia pactada.</li>
                  <li>El enganche pagado no es reembolsable una vez aceptado el crédito.</li>
                  <li>En caso de retraso en los pagos, se aplicará un cargo por mora de $50.00 MXN por día.</li>
                  <li>El cliente se compromete a mantener actualizados sus datos de contacto.</li>
                  <li>El incumplimiento del pago puede resultar en acciones legales y reportes a burós de crédito.</li>
                </ul>

                <p className="pt-2"><strong>2. INFORMACIÓN FINANCIERA:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>CAT (Costo Anual Total):</strong> {resultado.cat.toFixed(2)}% sin IVA. Para fines informativos y de comparación.</li>
                  <li><strong>Tasa de Interés Anual:</strong> {resultado.tasaInteresAjustada}%</li>
                  <li><strong>Mora:</strong> $50.00 MXN por día de retraso</li>
                  <li><strong>Comisiones:</strong> Sin comisiones adicionales por apertura o administración</li>
                </ul>

                <div className="pt-3" style={{ borderTop: "1px solid var(--color-warning)" }}>
                  <p className="font-semibold">DECLARACIÓN:</p>
                  <p className="mt-1">
                    El ACREDITADO declara haber leído y comprendido todas las cláusulas de este contrato,
                    aceptando libre y voluntariamente los términos y condiciones establecidos. El ACREDITADO
                    reconoce que toda la información proporcionada es verídica y se compromete a cumplir con
                    las obligaciones derivadas de este crédito.
                  </p>
                </div>
              </div>

              {/* Checkbox de aceptación */}
              <div className="mt-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    className="mt-1 w-4 h-4"
                  />
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <strong>Acepto</strong> todos los términos y condiciones descritos en este contrato de crédito.
                    {errors.terminos && <span style={errorSt} className="block mt-1">{errors.terminos}</span>}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Firma del Cliente */}
          {resultado && aceptaTerminos && (
            <div style={sectionSt}>
              <h4 className="text-sm font-medium mb-3" style={{ color: "var(--color-text-primary)" }}>
                ✍️ Firma del Contrato
              </h4>

              <div className="flex gap-3 mb-4">
                {(["digital", "manuscrita"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoFirma(tipo)}
                    className="flex-1 px-4 py-2 rounded-md text-sm transition-colors"
                    style={{
                      border: tipoFirma === tipo
                        ? `2px solid var(--color-accent)`
                        : `2px solid var(--color-border)`,
                      background: tipoFirma === tipo
                        ? "var(--color-accent-light)"
                        : "var(--color-bg-surface)",
                      color: tipoFirma === tipo
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    {tipo === "digital" ? "✍️ Firma Digital" : "✏️ Firma Manuscrita"}
                  </button>
                ))}
              </div>

              {tipoFirma === "digital" ? (
                <div className="space-y-3">
                  <label style={labelStyle}>Escriba su nombre completo como firma:</label>
                  <input
                    type="text"
                    value={firmaDigital}
                    onChange={handleFirmaDigitalChange}
                    placeholder="Ej: Juan Pérez García"
                    style={{
                      ...selectSt,
                      padding: "0.75rem 1rem",
                      border: "2px solid var(--color-border)",
                    }}
                  />
                  {firmaDigital && (
                    <div
                      className="mt-3 p-4 rounded-md text-center"
                      style={{
                        background: "var(--color-bg-elevated)",
                        border: "2px solid var(--color-border)",
                      }}
                    >
                      <p
                        className="text-3xl"
                        style={{ color: "var(--color-text-primary)", fontFamily: "'Brush Script MT', cursive" }}
                      >
                        {firmaDigital}
                      </p>
                      <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
                        Vista previa de la firma
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <label style={labelStyle}>Dibuje su firma en el recuadro:</label>
                  <div
                    className="rounded-md overflow-hidden"
                    style={{
                      border: "2px solid var(--color-border)",
                      background: "var(--color-bg-surface)",
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={150}
                      className="w-full cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <Button type="button" variant="secondary" onClick={limpiarCanvas} className="text-sm">
                    🗑️ Limpiar Firma
                  </Button>
                </div>
              )}

              {errors.firma && <p style={errorSt} className="mt-2">{errors.firma}</p>}

              <div
                className="mt-3 text-xs p-3 rounded"
                style={{
                  color: "var(--color-text-secondary)",
                  background: "var(--color-info-bg)",
                }}
              >
                <p>
                  <strong>Fecha de firma:</strong>{" "}
                  {new Date().toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Botones de Acción */}
      <div
        className="flex flex-col sm:flex-row gap-3 justify-end pt-4 sticky bottom-0"
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-bg-surface)",
        }}
      >
        <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !resultado || !aceptaTerminos || !firmaValida}
          className="w-full sm:w-auto"
        >
          {loading
            ? "Guardando..."
            : mode === "create"
            ? "✓ Crear Crédito con Firma"
            : "✓ Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
