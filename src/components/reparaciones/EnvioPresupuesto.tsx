"use client";

import { useState } from "react";
import { MessageSquare, Send, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OrdenReparacionDetallada } from "@/types";
import {
  generarMensajePresupuesto,
  abrirWhatsApp,
} from "@/lib/whatsapp-reparaciones";

interface EnvioPresupuestoProps {
  orden: OrdenReparacionDetallada;
  onEnviado?: () => void;
}

export function EnvioPresupuesto({ orden, onEnviado }: EnvioPresupuestoProps) {
  const [mostrandoPreview, setMostrandoPreview] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const mensaje = generarMensajePresupuesto(orden);
  const telefono = orden.clienteTelefono || "";

  const handleEnviar = async () => {
    if (!telefono) {
      alert("❌ No hay número de teléfono registrado para este cliente");
      return;
    }

    setEnviando(true);

    try {
      // Registrar envío en base de datos (opcional)
      try {
        await fetch(`/api/reparaciones/${orden.id}/notificaciones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "presupuesto_enviado",
            canal: "whatsapp",
            mensaje: mensaje,
            telefono: telefono,
          }),
        });
      } catch (dbError) {
        // Si falla el registro, continuamos con el envío
        console.warn("No se pudo registrar la notificación:", dbError);
      }

      // Abrir WhatsApp
      abrirWhatsApp(telefono, mensaje);

      // Callback opcional
      if (onEnviado) {
        onEnviado();
      }

      // Feedback visual
      alert("✅ WhatsApp abierto. Verifica el mensaje y envíalo al cliente.");
    } catch (error) {
      console.error("Error al enviar presupuesto:", error);
      alert(
        "⚠️ Hubo un error al abrir WhatsApp. Por favor, intenta nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Info del destinatario */}
      {telefono && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Destinatario:</span>
            <span className="font-semibold text-gray-900">{telefono}</span>
            <span className="text-gray-600">
              ({orden.clienteNombre} {orden.clienteApellido || ""})
            </span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMostrandoPreview(!mostrandoPreview)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                     border-2 border-blue-300 bg-blue-50 text-blue-700
                     rounded-lg font-semibold transition-all hover:bg-blue-100
                     focus:ring-4 focus:ring-blue-100"
        >
          {mostrandoPreview ? (
            <>
              <EyeOff className="w-4 h-4" />
              Ocultar Preview
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Vista Previa
            </>
          )}
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleEnviar}
          disabled={enviando || !telefono}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                     bg-gradient-to-r from-green-500 to-emerald-500 text-white
                     rounded-lg font-semibold shadow-lg transition-all
                     hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed
                     focus:ring-4 focus:ring-green-100"
        >
          {enviando ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar por WhatsApp
            </>
          )}
        </motion.button>
      </div>

      {/* Preview del mensaje */}
      <AnimatePresence>
        {mostrandoPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-5 shadow-inner">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gray-300">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    Mensaje de Presupuesto
                  </h4>
                  <p className="text-xs text-gray-600">
                    Esto es lo que verá el cliente
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-md">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {mensaje}
                </pre>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="font-medium">
                  📱 Se enviará vía WhatsApp Web
                </span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerta si no hay teléfono */}
      {!telefono && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-start gap-2">
          <span className="text-red-600 text-lg">⚠️</span>
          <div className="text-xs text-red-700">
            <p className="font-semibold mb-1">No hay número de WhatsApp</p>
            <p>
              Este cliente no tiene un número de teléfono o WhatsApp registrado.
              Por favor, actualiza la información del cliente antes de enviar el
              presupuesto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
