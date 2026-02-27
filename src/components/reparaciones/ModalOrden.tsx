"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Smartphone,
  Camera,
  Settings,
  Lock,
  PenTool,
  DollarSign,
  Plus,
  UserPlus,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SistemaFotosOrden } from "./fotos/SistemaFotosOrden";
import { IconosFuncionamiento } from "./condiciones/IconosFuncionamiento";
import { IconosEstadoFisico } from "./condiciones/IconosEstadoFisico";
import { ComponentePresupuesto } from "./presupuesto/ComponentePresupuesto";
import { CapturaPatron } from "./patron/CapturaPatron";
import { FormularioCuentas } from "./cuentas/FormularioCuentas";
import { SelectorTipoFirma } from "./firma/SelectorTipoFirma";
import { generarDeslindesInteligentes } from "@/lib/deslindes-legales";
import {
  CondicionesFuncionamiento,
  EstadoFisicoDispositivo,
  CuentaDispositivo,
  ImagenReparacion,
  TipoFirma,
  AnticipoReparacion,
} from "@/types";

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion?: string;
  email?: string;
}

interface ModalOrdenProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalOrden({ isOpen, onClose, onSuccess }: ModalOrdenProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mostrarFormNuevoCliente, setMostrarFormNuevoCliente] = useState(false);
  const [creandoCliente, setCreandoCliente] = useState(false);

  // Para super_admin: selección de distribuidor al crear cliente
  const [distribuidores, setDistribuidores] = useState<{ id: string; nombre: string }[]>([]);
  const [distribuidorSeleccionado, setDistribuidorSeleccionado] = useState("");

  // Form state - Datos básicos
  const [formData, setFormData] = useState({
    clienteId: "",
    marcaDispositivo: "",
    modeloDispositivo: "",
    imei: "",
    numeroSerie: "",
    problemaReportado: "",
    fechaEstimadaEntrega: "",
    prioridad: "normal",
    notasInternas: "",
  });

  // Form state - Nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
    email: "",
  });

  // Folio pre-reservado al abrir el modal
  const [folioReservado, setFolioReservado] = useState<string | null>(null);
  const [cargandoFolio, setCargandoFolio] = useState(false);

  // Form state - Fase 8B y 8C
  const [imagenes, setImagenes] = useState<ImagenReparacion[]>([]);
  const [condicionesFuncionamiento, setCondicionesFuncionamiento] =
    useState<CondicionesFuncionamiento>({
      bateria: "ok",
      pantallaTactil: "ok",
      camaras: "ok",
      microfono: "ok",
      altavoz: "ok",
      bluetooth: "ok",
      wifi: "ok",
      botonEncendido: "ok",
      botonesVolumen: "ok",
      sensorHuella: "ok",
      llegaApagado: false,
      estaMojado: false,
      bateriaHinchada: false,
    });

  const [estadoFisico, setEstadoFisico] = useState<EstadoFisicoDispositivo>({
    marco: "perfecto",
    bisel: "perfecto",
    pantallaFisica: "perfecto",
    camaraLente: "perfecto",
    tapaTrasera: "perfecto",
    tieneSIM: false,
    tieneMemoriaSD: false,
    observacionesFisicas: "",
  });

  // Presupuesto
  const [presupuestoTotal, setPresupuestoTotal] = useState<number>(0);
  const [anticipos, setAnticipos] = useState<any[]>([]);

  const [patronDesbloqueo, setPatronDesbloqueo] = useState<string>("");
  const [passwordDispositivo, setPasswordDispositivo] = useState<string>("");
  const [cuentasDispositivo, setCuentasDispositivo] = useState<CuentaDispositivo[]>([]);
  const [tipoFirma, setTipoFirma] = useState<TipoFirma | null>(null);
  const [firmaData, setFirmaData] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchClientes();
      reservarFolio();
      if (isSuperAdmin) fetchDistribuidores();
    } else {
      // Si el modal se cierra sin haber guardado, cancelar el folio reservado
      if (folioReservado) {
        cancelarFolioReservado(folioReservado);
        setFolioReservado(null);
      }
    }
  }, [isOpen]);

  async function fetchDistribuidores() {
    try {
      const res = await fetch("/api/admin/distribuidores");
      const data = await res.json();
      if (data.success) {
        setDistribuidores(data.data.map((d: { id: string; nombre: string }) => ({ id: d.id, nombre: d.nombre })));
      }
    } catch {
      // silencioso
    }
  }

  async function reservarFolio() {
    try {
      setCargandoFolio(true);
      const response = await fetch("/api/reparaciones/reservar-folio", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setFolioReservado(data.folio);
      }
    } catch (error) {
      console.error("Error al reservar folio:", error);
    } finally {
      setCargandoFolio(false);
    }
  }

  async function cancelarFolioReservado(folio: string) {
    try {
      await fetch("/api/reparaciones/reservar-folio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folio }),
      });
    } catch (error) {
      console.error("Error al cancelar folio:", error);
    }
  }

  async function fetchClientes() {
    try {
      setLoadingClientes(true);
      const response = await fetch("/api/clientes");
      const data = await response.json();

      if (data.success) {
        setClientes(data.data);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setLoadingClientes(false);
    }
  }

  async function handleCrearCliente(e: React.FormEvent) {
    e.preventDefault();

    if (!nuevoCliente.nombre || !nuevoCliente.apellido || !nuevoCliente.telefono) {
      alert("Por favor completa al menos Nombre, Apellido y Teléfono");
      return;
    }

    if (isSuperAdmin && !distribuidorSeleccionado) {
      alert("Por favor selecciona un distribuidor para el nuevo cliente");
      return;
    }

    try {
      setCreandoCliente(true);
      // CURP único para evitar violación de constraint UNIQUE de la tabla clientes
      const curpTemporal = `PEND-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoCliente,
          direccion: nuevoCliente.direccion || "Sin dirección",
          curp: curpTemporal,
          ine: "PENDIENTE",
          ...(isSuperAdmin ? { distribuidorId: distribuidorSeleccionado } : {}),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Agregar el nuevo cliente a la lista
        setClientes([...clientes, data.data]);
        // Seleccionarlo automáticamente
        setFormData({ ...formData, clienteId: data.data.id });
        // Cerrar el formulario
        setMostrarFormNuevoCliente(false);
        // Limpiar el formulario de nuevo cliente
        setNuevoCliente({
          nombre: "",
          apellido: "",
          telefono: "",
          direccion: "",
          email: "",
        });
        alert("✓ Cliente creado exitosamente");
      } else {
        alert(`Error: ${data.error || data.message || "No se pudo crear el cliente"}`);
      }
    } catch (error) {
      console.error("Error al crear cliente:", error);
      alert("Error al crear el cliente");
    } finally {
      setCreandoCliente(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validaciones básicas
    if (
      !formData.clienteId ||
      !formData.marcaDispositivo ||
      !formData.modeloDispositivo ||
      !formData.problemaReportado
    ) {
      alert("Por favor completa los campos requeridos: Cliente, Marca, Modelo y Problema");
      return;
    }

    if (!tipoFirma || !firmaData) {
      alert("Por favor captura la firma del cliente antes de finalizar");
      return;
    }

    try {
      setSubmitting(true);

      // Generar deslindes legales automáticamente (para PDF)
      const deslindesLegales = generarDeslindesInteligentes(
        formData.problemaReportado,
        condicionesFuncionamiento,
        estadoFisico
      );

      const payload = {
        // Datos básicos
        ...formData,
        // Folio pre-reservado (generado al abrir el modal)
        folioPreReservado: folioReservado || undefined,

        // Fase 8B - Datos avanzados
        patronDesbloqueo: patronDesbloqueo || null,
        passwordDispositivo: passwordDispositivo || null,
        cuentasDispositivo: cuentasDispositivo,
        condicionesFuncionamiento: condicionesFuncionamiento,
        estadoFisicoDispositivo: estadoFisico,
        deslindesLegales: deslindesLegales,
        firmaCliente: firmaData,
        tipoFirma: tipoFirma,
        fechaFirma: new Date().toISOString(),
        imagenesIds: imagenes.map((img) => img.id),

        // Fase 8C - Presupuesto
        presupuestoTotal,
        anticiposData: anticipos,
      };

      const response = await fetch("/api/reparaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Generar QR automáticamente
        try {
          await fetch("/api/reparaciones/qr/generar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ordenId: data.data.id }),
          });
        } catch (qrError) {
          console.error("Error al generar QR:", qrError);
        }

        // Generar PDF automáticamente
        try {
          const pdfResponse = await fetch(`/api/reparaciones/${data.data.id}/pdf`, {
            method: "POST",
          });

          if (pdfResponse.ok) {
            const pdfBlob = await pdfResponse.blob();
            const pdfUrl = URL.createObjectURL(pdfBlob);

            // Abrir PDF en nueva pestaña
            window.open(pdfUrl, "_blank");
          }
        } catch (pdfError) {
          console.error("Error al generar PDF:", pdfError);
        }

        alert(
          `✓ Orden ${data.data.folio} creada exitosamente!\n\n` +
          `${imagenes.length} fotos adjuntadas\n` +
          `${deslindesLegales.length} deslindes legales aplicados\n` +
          `Presupuesto Total: $${presupuestoTotal.toFixed(2)}\n` +
          `Anticipos: $${anticipos.reduce((sum, a) => sum + a.monto, 0).toFixed(2)}\n\n` +
          `El PDF se abrirá en una nueva pestaña.`
        );

        // Limpiar folio reservado (ya fue usado — no cancelar)
        setFolioReservado(null);
        onSuccess();
        onClose();
        resetForm();
      } else {
        alert(`Error: ${data.error || data.message || "No se pudo crear la orden"}`);
      }
    } catch (error) {
      console.error("Error al crear orden:", error);
      alert("Error al crear la orden de reparación");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFormData({
      clienteId: "",
      marcaDispositivo: "",
      modeloDispositivo: "",
      imei: "",
      numeroSerie: "",
      problemaReportado: "",
      fechaEstimadaEntrega: "",
      prioridad: "normal",
      notasInternas: "",
    });
    setImagenes([]);
    setCondicionesFuncionamiento({
      bateria: "ok",
      pantallaTactil: "ok",
      camaras: "ok",
      microfono: "ok",
      altavoz: "ok",
      bluetooth: "ok",
      wifi: "ok",
      botonEncendido: "ok",
      botonesVolumen: "ok",
      sensorHuella: "ok",
      llegaApagado: false,
      estaMojado: false,
      bateriaHinchada: false,
    });
    setEstadoFisico({
      marco: "perfecto",
      bisel: "perfecto",
      pantallaFisica: "perfecto",
      camaraLente: "perfecto",
      tapaTrasera: "perfecto",
      tieneSIM: false,
      tieneMemoriaSD: false,
      observacionesFisicas: "",
    });
    setPresupuestoTotal(0);
    setAnticipos([]);
    setPatronDesbloqueo("");
    setPasswordDispositivo("");
    setCuentasDispositivo([]);
    setTipoFirma(null);
    setFirmaData(null);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📝 Nueva Orden de Reparación"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* FOLIO PRE-GENERADO */}
        <div className="flex items-center justify-between px-2 py-2 rounded-lg border border-dashed border-blue-300 bg-blue-50">
          <span className="text-sm font-medium text-blue-700">Folio de la orden:</span>
          <span className="font-mono font-bold text-blue-900 tracking-widest text-base">
            {cargandoFolio ? "Generando..." : (folioReservado || "Pendiente")}
          </span>
        </div>

        {/* El scroll lo maneja el Modal; solo añadimos padding lateral y espaciado */}
        <div className="px-2 space-y-6">

          {/* SECCIÓN 1: DATOS BÁSICOS - DISEÑO ENTERPRISE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg"
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-900">Datos Básicos</h2>
                  <p className="text-sm text-blue-700">Información del cliente y dispositivo</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Cliente con opción de crear nuevo */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Cliente <span className="text-red-500">*</span>
                  </label>

                  {!mostrarFormNuevoCliente ? (
                    <div className="flex gap-2">
                      <select
                        name="clienteId"
                        value={formData.clienteId}
                        onChange={handleChange}
                        required
                        disabled={loadingClientes}
                        className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 font-medium shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">
                          {loadingClientes ? "Cargando clientes..." : "Seleccionar cliente"}
                        </option>
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre} {cliente.apellido} - {cliente.telefono}
                          </option>
                        ))}
                      </select>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMostrarFormNuevoCliente(true)}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                      >
                        <UserPlus className="h-5 w-5" />
                        Nuevo
                      </motion.button>
                    </div>
                  ) : (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-lg"
                      >
                        <h4 className="mb-3 text-sm font-bold text-green-800">
                          Crear Nuevo Cliente
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {isSuperAdmin && (
                            <select
                              value={distribuidorSeleccionado}
                              onChange={(e) => setDistribuidorSeleccionado(e.target.value)}
                              className="md:col-span-2 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-sm transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                              required
                            >
                              <option value="">Seleccionar distribuidor *</option>
                              {distribuidores.map((d) => (
                                <option key={d.id} value={d.id}>{d.nombre}</option>
                              ))}
                            </select>
                          )}
                          <input
                            type="text"
                            value={nuevoCliente.nombre}
                            onChange={(e) =>
                              setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
                            }
                            placeholder="Nombre *"
                            className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm transition-all focus:border-green-500 focus:ring-4 focus:ring-green-100"
                            required
                          />
                          <input
                            type="text"
                            value={nuevoCliente.apellido}
                            onChange={(e) =>
                              setNuevoCliente({ ...nuevoCliente, apellido: e.target.value })
                            }
                            placeholder="Apellido *"
                            className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm transition-all focus:border-green-500 focus:ring-4 focus:ring-green-100"
                            required
                          />
                          <input
                            type="tel"
                            value={nuevoCliente.telefono}
                            onChange={(e) =>
                              setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })
                            }
                            placeholder="Teléfono *"
                            className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm transition-all focus:border-green-500 focus:ring-4 focus:ring-green-100"
                            required
                          />
                          <input
                            type="email"
                            value={nuevoCliente.email}
                            onChange={(e) =>
                              setNuevoCliente({ ...nuevoCliente, email: e.target.value })
                            }
                            placeholder="Email (opcional)"
                            className="rounded-lg border-2 border-gray-200 px-3 py-2 text-sm transition-all focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          />
                          <input
                            type="text"
                            value={nuevoCliente.direccion}
                            onChange={(e) =>
                              setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })
                            }
                            placeholder="Dirección (opcional)"
                            className="md:col-span-2 rounded-lg border-2 border-gray-200 px-3 py-2 text-sm transition-all focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          />
                        </div>
                        <div className="mt-3 flex gap-2">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCrearCliente}
                            disabled={creandoCliente}
                            className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
                          >
                            {creandoCliente ? "Creando..." : "Crear Cliente"}
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setMostrarFormNuevoCliente(false)}
                            className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                          >
                            Cancelar
                          </motion.button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                {/* Dispositivo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Marca <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="marcaDispositivo"
                      value={formData.marcaDispositivo}
                      onChange={handleChange}
                      required
                      placeholder="Samsung, Apple, Xiaomi"
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-medium shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Modelo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="modeloDispositivo"
                      value={formData.modeloDispositivo}
                      onChange={handleChange}
                      required
                      placeholder="Galaxy A54, iPhone 12"
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-medium shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      IMEI (Opcional)
                    </label>
                    <input
                      type="text"
                      name="imei"
                      value={formData.imei}
                      onChange={handleChange}
                      placeholder="15 dígitos"
                      maxLength={15}
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Número de Serie (Opcional)
                    </label>
                    <input
                      type="text"
                      name="numeroSerie"
                      value={formData.numeroSerie}
                      onChange={handleChange}
                      placeholder="Número de serie"
                      className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Problema */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Problema Reportado <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="problemaReportado"
                    value={formData.problemaReportado}
                    onChange={handleChange}
                    required
                    rows={3}
                    placeholder="Describe el problema que presenta el dispositivo"
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Prioridad
                  </label>
                  <select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 font-medium shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="baja">🟢 Baja</option>
                    <option value="normal">🟡 Normal</option>
                    <option value="alta">🟠 Alta</option>
                    <option value="urgente">🔴 Urgente</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SECCIÓN 2: FOTOS - DISEÑO ENTERPRISE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-lg"
          >
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-3 shadow-lg">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-900">Fotos del Dispositivo</h2>
                  <p className="text-sm text-green-700">QR, subida directa o desde celular</p>
                </div>
              </div>
              <SistemaFotosOrden
                ordenId="temp-creacion"
                modoCreacion={true}
                imagenes={imagenes}
                onChange={setImagenes}
              />

              {/* Patrón de desbloqueo */}
              <div className="border-t-2 border-green-200 mt-6 pt-6">
                <CapturaPatron
                  onPatronCapturado={(patron) => setPatronDesbloqueo(patron.codificado)}
                  patronActual={patronDesbloqueo}
                />
              </div>

              {/* Contraseña / PIN del dispositivo */}
              <div className="border-t-2 border-yellow-200 mt-6 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🔐</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                      Contraseña / PIN / Código
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Si el cliente tiene contraseña numérica o alfanumérica (opcional — el técnico la verá en la orden)
                    </p>
                  </div>
                </div>
                <input
                  type="text"
                  value={passwordDispositivo}
                  onChange={(e) => setPasswordDispositivo(e.target.value)}
                  placeholder="Ej: 1234, abc123, 0000..."
                  className="w-full rounded-lg border-2 border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  maxLength={50}
                />
              </div>
            </div>
          </motion.div>

          {/* SECCIÓN 3: CONDICIONES - DISEÑO ENTERPRISE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-lg"
          >
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-3 shadow-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-orange-900">Condiciones del Dispositivo</h2>
                  <p className="text-sm text-orange-700">Funcionamiento y estado físico</p>
                </div>
              </div>

              <div className="space-y-6">
                <IconosFuncionamiento
                  condiciones={condicionesFuncionamiento}
                  onChange={setCondicionesFuncionamiento}
                />

                <div className="border-t-2 border-orange-200 pt-6">
                  <IconosEstadoFisico
                    estadoFisico={estadoFisico}
                    onChange={setEstadoFisico}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* SECCIÓN 4: PRESUPUESTO - NUEVO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-lg"
          >
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-emerald-900">Presupuesto y Anticipos</h2>
                  <p className="text-sm text-emerald-700">Costos y pagos parciales</p>
                </div>
              </div>

              <ComponentePresupuesto
                presupuestoTotal={presupuestoTotal}
                anticipos={anticipos}
                onChange={(data) => {
                  setPresupuestoTotal(data.presupuestoTotal);
                  setAnticipos(data.anticipos);
                }}
              />
            </div>
          </motion.div>

          {/* SECCIÓN 5: CUENTAS DEL DISPOSITIVO - DISEÑO ENTERPRISE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative overflow-hidden rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 shadow-lg"
          >
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 p-3 shadow-lg">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-purple-900">Cuentas del Dispositivo</h2>
                  <p className="text-sm text-purple-700">Google, Apple, Samsung, etc. (opcional)</p>
                </div>
              </div>

              <FormularioCuentas
                cuentas={cuentasDispositivo}
                onChange={setCuentasDispositivo}
              />
            </div>
          </motion.div>

          {/* SECCIÓN 6: FIRMA - DISEÑO ENTERPRISE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative overflow-hidden rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 p-6 shadow-lg"
          >
            <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-xl bg-gradient-to-br from-red-500 to-rose-600 p-3 shadow-lg">
                  <PenTool className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-900">
                    Firma del Cliente <span className="text-red-500">*</span>
                  </h2>
                  <p className="text-sm text-red-700">Digital o manuscrita</p>
                </div>
              </div>

              <SelectorTipoFirma
                tipoFirma={tipoFirma}
                firmaData={firmaData}
                onFirmaCapturada={(tipo, firma) => {
                  setTipoFirma(tipo);
                  setFirmaData(firma);
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Botones fijos al final con glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 -mx-6 -mb-6 flex gap-3 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-6 pb-6 pt-4 backdrop-blur-lg"
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-bold text-gray-700 shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
          >
            Cancelar
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={submitting || !tipoFirma || !firmaData}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="mr-2 animate-spin">⏳</span>
                Creando orden y PDF...
              </>
            ) : (
              <>
                <span className="mr-2">✓</span>
                Finalizar y Generar PDF
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </Modal>
  );
}
