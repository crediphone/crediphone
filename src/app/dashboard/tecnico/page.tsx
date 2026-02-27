"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Search,
  Filter,
  Eye,
  Send,
  Clock,
  CheckCircle2,
  Package,
  AlertCircle,
} from "lucide-react";
import { OrdenReparacion, OrdenReparacionDetallada, EstadoOrdenReparacion } from "@/types";
import { ModalDiagnostico } from "@/components/reparaciones/ModalDiagnostico";
import { EstadoBadge, PrioridadBadge } from "@/components/reparaciones/EstadoBadge";

interface Estadisticas {
  total: number;
  diagnostico: number;
  presupuesto: number;
  aprobado: number;
  en_reparacion: number;
  completado_hoy: number;
}

export default function PanelTecnicoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ordenes, setOrdenes] = useState<OrdenReparacionDetallada[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    total: 0,
    diagnostico: 0,
    presupuesto: 0,
    aprobado: 0,
    en_reparacion: 0,
    completado_hoy: 0,
  });

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todas");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas");

  // Modal de diagnóstico
  const [modalDiagnosticoOpen, setModalDiagnosticoOpen] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenReparacionDetallada | null>(null);

  // Cargar datos al montar
  useEffect(() => {
    cargarOrdenes();

    // Refresh automático cada 60 segundos
    const interval = setInterval(cargarOrdenes, 60000);
    return () => clearInterval(interval);
  }, []);

  async function cargarOrdenes() {
    try {
      setLoading(true);

      // Obtener usuario actual (técnico)
      const userResponse = await fetch("/api/auth/me");
      const userData = await userResponse.json();

      if (!userData.success || !userData.user) {
        router.push("/login");
        return;
      }

      const tecnicoId = userData.user.id;

      // Cargar órdenes del técnico
      const response = await fetch(
        `/api/reparaciones?tecnico_id=${tecnicoId}&detalladas=true`
      );
      const data = await response.json();

      if (data.success) {
        setOrdenes(data.data);
        calcularEstadisticas(data.data);
      } else {
        console.error("Error al cargar órdenes:", data.message);
      }
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
    } finally {
      setLoading(false);
    }
  }

  function calcularEstadisticas(ordenes: OrdenReparacionDetallada[]) {
    const hoy = new Date().toISOString().split("T")[0];

    const stats: Estadisticas = {
      total: ordenes.length,
      diagnostico: ordenes.filter((o) => o.estado === "diagnostico").length,
      presupuesto: ordenes.filter((o) => o.estado === "presupuesto").length,
      aprobado: ordenes.filter((o) => o.estado === "aprobado").length,
      en_reparacion: ordenes.filter((o) => o.estado === "en_reparacion").length,
      completado_hoy: ordenes.filter(
        (o) =>
          o.estado === "completado" &&
          o.fechaCompletado &&
          new Date(o.fechaCompletado).toISOString().split("T")[0] === hoy
      ).length,
    };

    setEstadisticas(stats);
  }

  const ordenesFiltradas = ordenes.filter((orden) => {
    // Filtro de búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const coincide =
        orden.folio?.toLowerCase().includes(query) ||
        orden.clienteNombre?.toLowerCase().includes(query) ||
        orden.clienteApellido?.toLowerCase().includes(query) ||
        orden.marcaDispositivo?.toLowerCase().includes(query) ||
        orden.modeloDispositivo?.toLowerCase().includes(query) ||
        orden.imei?.toLowerCase().includes(query);

      if (!coincide) return false;
    }

    // Filtro de estado
    if (filtroEstado !== "todas" && orden.estado !== filtroEstado) {
      return false;
    }

    // Filtro de prioridad
    if (filtroPrioridad !== "todas" && orden.prioridad !== filtroPrioridad) {
      return false;
    }

    return true;
  });

  function handleAbrirDiagnostico(orden: OrdenReparacionDetallada) {
    setOrdenSeleccionada(orden);
    setModalDiagnosticoOpen(true);
  }

  function handleEnviarPresupuesto(orden: OrdenReparacionDetallada) {
    // Abrir modal con la orden para enviar presupuesto directamente
    setOrdenSeleccionada(orden);
    setModalDiagnosticoOpen(true);
  }

  function handleVerDetalle(ordenId: string) {
    router.push(`/dashboard/reparaciones?orden=${ordenId}`);
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Panel del Técnico
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestiona tus órdenes de reparación asignadas
            </p>
          </div>
        </div>
      </motion.div>

      {/* Estadísticas */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
        >
          {/* Total */}
          <StatCard
            title="Total Asignadas"
            value={estadisticas.total}
            icon={<Package className="w-5 h-5" />}
            color="blue"
          />

          {/* Diagnóstico */}
          <StatCard
            title="En Diagnóstico"
            value={estadisticas.diagnostico}
            icon={<Search className="w-5 h-5" />}
            color="yellow"
          />

          {/* Presupuesto */}
          <StatCard
            title="Presupuesto"
            value={estadisticas.presupuesto}
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          />

          {/* Aprobado */}
          <StatCard
            title="Aprobadas"
            value={estadisticas.aprobado}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
          />

          {/* En Reparación */}
          <StatCard
            title="En Reparación"
            value={estadisticas.en_reparacion}
            icon={<Wrench className="w-5 h-5" />}
            color="purple"
          />

          {/* Completadas Hoy */}
          <StatCard
            title="Completadas Hoy"
            value={estadisticas.completado_hoy}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="teal"
          />
        </motion.div>
      )}

      {/* Barra de herramientas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por folio, cliente, dispositivo, IMEI..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="flex-1 px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            >
              <option value="todas">Todos los estados</option>
              <option value="recibido">Recibido</option>
              <option value="diagnostico">Diagnóstico</option>
              <option value="presupuesto">Presupuesto</option>
              <option value="aprobado">Aprobado</option>
              <option value="en_reparacion">En Reparación</option>
              <option value="completado">Completado</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Tabla de órdenes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
      >
        {loading ? (
          <LoadingState />
        ) : ordenesFiltradas.length === 0 ? (
          <EmptyState hasFilters={searchQuery !== "" || filtroEstado !== "todas"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Folio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Dispositivo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Problema
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence mode="popLayout">
                  {ordenesFiltradas.map((orden, index) => (
                    <motion.tr
                      key={orden.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-blue-600">
                          {orden.folio}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {orden.clienteNombre} {orden.clienteApellido || ""}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {orden.clienteTelefono}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {orden.marcaDispositivo} {orden.modeloDispositivo}
                        </div>
                        {orden.imei && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            IMEI: {orden.imei}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                          {orden.problemaReportado || "Sin especificar"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EstadoBadge estado={orden.estado} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PrioridadBadge prioridad={orden.prioridad || "normal"} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* Botón Actualizar Diagnóstico */}
                          {(orden.estado === "recibido" ||
                            orden.estado === "diagnostico" ||
                            orden.estado === "presupuesto") && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleAbrirDiagnostico(orden)}
                              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                              title="Actualizar Diagnóstico"
                            >
                              <Wrench className="w-4 h-4" />
                            </motion.button>
                          )}

                          {/* Botón Enviar Presupuesto */}
                          {orden.estado === "presupuesto" && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEnviarPresupuesto(orden)}
                              className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                              title="Enviar Presupuesto por WhatsApp"
                            >
                              <Send className="w-4 h-4" />
                            </motion.button>
                          )}

                          {/* Botón Ver Detalles */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleVerDetalle(orden.id)}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            title="Ver Detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal de Diagnóstico */}
      {ordenSeleccionada && (
        <ModalDiagnostico
          isOpen={modalDiagnosticoOpen}
          onClose={() => {
            setModalDiagnosticoOpen(false);
            setOrdenSeleccionada(null);
          }}
          onSuccess={() => {
            cargarOrdenes();
          }}
          ordenId={ordenSeleccionada.id}
          ordenFolio={ordenSeleccionada.folio}
          dispositivo={`${ordenSeleccionada.marcaDispositivo} ${ordenSeleccionada.modeloDispositivo}`}
          orden={ordenSeleccionada}
        />
      )}
    </div>
  );
}

// Componente StatCard
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "yellow" | "orange" | "green" | "purple" | "teal";
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 text-blue-600",
    yellow: "from-yellow-500 to-yellow-600 text-yellow-600",
    orange: "from-orange-500 to-orange-600 text-orange-600",
    green: "from-green-500 to-green-600 text-green-600",
    purple: "from-purple-500 to-purple-600 text-purple-600",
    teal: "from-teal-500 to-teal-600 text-teal-600",
  };

  const bgClass = colorClasses[color].split(" ")[0] + " " + colorClasses[color].split(" ")[1];
  const textClass = colorClasses[color].split(" ")[2];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${bgClass} text-white`}>
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{title}</div>
      </div>
    </motion.div>
  );
}

// Estado de carga
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando órdenes...</p>
    </div>
  );
}

// Estado vacío
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
        {hasFilters ? (
          <Filter className="w-10 h-10 text-gray-400" />
        ) : (
          <Package className="w-10 h-10 text-gray-400" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {hasFilters
          ? "No se encontraron resultados"
          : "No tienes órdenes asignadas"}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
        {hasFilters
          ? "Intenta ajustar los filtros de búsqueda o estado para ver más resultados."
          : "Cuando te asignen órdenes de reparación, aparecerán aquí."}
      </p>
    </div>
  );
}
