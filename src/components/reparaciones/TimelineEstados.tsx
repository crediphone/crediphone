"use client";

import { motion } from "framer-motion";
import {
  Package,
  Search,
  DollarSign,
  CheckCircle,
  Wrench,
  Star,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
} from "lucide-react";

interface HistorialEstado {
  id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  usuario?: { name: string } | null;
  comentario?: string | null;
  created_at: string;
}

interface TimelineEstadosProps {
  historial: HistorialEstado[];
}

// Mapeo de estados a iconos
const ICONOS_ESTADO: Record<string, React.ReactNode> = {
  recibido: <Package className="w-5 h-5 text-blue-600" />,
  diagnostico: <Search className="w-5 h-5 text-purple-600" />,
  presupuesto: <DollarSign className="w-5 h-5 text-yellow-600" />,
  aprobado: <CheckCircle className="w-5 h-5 text-green-600" />,
  en_reparacion: <Wrench className="w-5 h-5 text-orange-600" />,
  completado: <Star className="w-5 h-5 text-green-700" />,
  listo_entrega: <PackageCheck className="w-5 h-5 text-teal-600" />,
  entregado: <CheckCircle2 className="w-5 h-5 text-green-800" />,
  no_reparable: <XCircle className="w-5 h-5 text-red-600" />,
  cancelado: <Ban className="w-5 h-5 text-gray-600" />,
};

// Mapeo de estados a colores de borde
const COLORES_ESTADO: Record<string, string> = {
  recibido: "border-blue-500",
  diagnostico: "border-purple-500",
  presupuesto: "border-yellow-500",
  aprobado: "border-green-500",
  en_reparacion: "border-orange-500",
  completado: "border-green-600",
  listo_entrega: "border-teal-500",
  entregado: "border-green-700",
  no_reparable: "border-red-500",
  cancelado: "border-gray-500",
};

// Mapeo de estados a nombres legibles
const NOMBRES_ESTADO: Record<string, string> = {
  recibido: "Recibido",
  diagnostico: "En Diagnóstico",
  presupuesto: "Presupuesto Pendiente",
  aprobado: "Presupuesto Aprobado",
  en_reparacion: "En Reparación",
  completado: "Reparación Completada",
  listo_entrega: "Listo para Entrega",
  entregado: "Entregado",
  no_reparable: "No Reparable",
  cancelado: "Cancelado",
};

/**
 * Formatea fecha en español con formato legible
 */
function formatearFecha(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  const opciones: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return fecha.toLocaleDateString("es-MX", opciones);
}

/**
 * Obtiene el nombre del usuario, manejando diferentes formatos
 */
function obtenerNombreUsuario(usuario: { name: string } | null | undefined): string {
  if (!usuario || !usuario.name) {
    return "Sistema Automático";
  }
  return usuario.name;
}

export function TimelineEstados({ historial }: TimelineEstadosProps) {
  // Estado vacío
  if (!historial || historial.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Clock className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Sin Historial de Estados
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Esta orden aún no tiene cambios de estado registrados. Los cambios
          aparecerán aquí automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 py-4">
      {/* Línea vertical del timeline */}
      <div
        className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 to-gray-300"
        style={{ zIndex: 0 }}
      />

      {/* Eventos del historial */}
      {historial.map((evento, index) => {
        const estadoColor = COLORES_ESTADO[evento.estado_nuevo] || "border-gray-500";
        const nombreEstado = NOMBRES_ESTADO[evento.estado_nuevo] || evento.estado_nuevo;
        const icono = ICONOS_ESTADO[evento.estado_nuevo] || (
          <Package className="w-5 h-5 text-gray-600" />
        );

        return (
          <motion.div
            key={evento.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            className="relative pl-12"
            style={{ zIndex: 1 }}
          >
            {/* Punto en la línea con icono */}
            <div
              className={`absolute left-0 w-8 h-8 rounded-full bg-white border-4 ${estadoColor}
                         flex items-center justify-center shadow-md`}
              style={{ zIndex: 2 }}
            >
              {icono}
            </div>

            {/* Contenido del evento */}
            <motion.div
              whileHover={{ scale: 1.01, boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
              className="bg-white rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md
                         transition-all duration-200 p-4"
            >
              {/* Header con estado y fecha */}
              <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                <h4 className="font-bold text-gray-900 text-base">
                  {nombreEstado}
                </h4>
                <span className="text-xs text-gray-500 font-medium">
                  {formatearFecha(evento.created_at)}
                </span>
              </div>

              {/* Usuario que realizó el cambio */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500
                               flex items-center justify-center text-white text-xs font-bold">
                  {obtenerNombreUsuario(evento.usuario).charAt(0).toUpperCase()}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">por</span>{" "}
                  <span className="font-semibold text-gray-800">
                    {obtenerNombreUsuario(evento.usuario)}
                  </span>
                </p>
              </div>

              {/* Estado anterior (si existe) */}
              {evento.estado_anterior && (
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-medium">Estado anterior:</span>{" "}
                  {NOMBRES_ESTADO[evento.estado_anterior] || evento.estado_anterior}
                </div>
              )}

              {/* Comentario (si existe) */}
              {evento.comentario && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 italic">
                    <span className="font-semibold not-italic">💬 Comentario:</span> "
                    {evento.comentario}"
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        );
      })}

      {/* Indicador de inicio */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: historial.length * 0.08 + 0.2 }}
        className="relative pl-12"
      >
        <div
          className="absolute left-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400
                     border-4 border-white flex items-center justify-center shadow-md"
        >
          <div className="w-3 h-3 rounded-full bg-white" />
        </div>
        <div className="text-sm text-gray-500 font-medium italic py-2">
          Inicio del registro
        </div>
      </motion.div>
    </div>
  );
}
