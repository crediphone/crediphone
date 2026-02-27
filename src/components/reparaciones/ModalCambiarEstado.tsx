"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EstadoBadge } from "@/components/reparaciones/EstadoBadge";
import type { EstadoOrdenReparacion } from "@/types";
import { ArrowRight, AlertCircle } from "lucide-react";

interface ModalCambiarEstadoProps {
  isOpen: boolean;
  onClose: () => void;
  ordenId: string;
  folio: string;
  estadoActual: EstadoOrdenReparacion;
  onSuccess: () => void;
}

// Transiciones válidas según el estado actual
const transicionesValidas: Record<EstadoOrdenReparacion, EstadoOrdenReparacion[]> = {
  recibido: ["diagnostico"],
  diagnostico: ["presupuesto", "aprobado"],
  presupuesto: ["aprobado", "cancelado"],
  aprobado: ["en_reparacion"],
  en_reparacion: ["completado", "no_reparable"],
  completado: ["listo_entrega"],
  listo_entrega: ["entregado"],
  entregado: [],
  no_reparable: [],
  cancelado: [],
};

const estadosLabels: Record<EstadoOrdenReparacion, string> = {
  recibido: "Recibido",
  diagnostico: "En Diagnóstico",
  presupuesto: "Presupuesto Pendiente",
  aprobado: "Aprobado",
  en_reparacion: "En Reparación",
  completado: "Completado",
  listo_entrega: "Listo para Entrega",
  entregado: "Entregado",
  no_reparable: "No Reparable",
  cancelado: "Cancelado",
};

// Estados que requieren confirmación
const estadosCriticos: EstadoOrdenReparacion[] = ["cancelado", "no_reparable"];

export function ModalCambiarEstado({
  isOpen,
  onClose,
  ordenId,
  folio,
  estadoActual,
  onSuccess,
}: ModalCambiarEstadoProps) {
  const [nuevoEstado, setNuevoEstado] = useState<EstadoOrdenReparacion | "">("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const estadosDisponibles = transicionesValidas[estadoActual] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nuevoEstado) {
      setError("Debe seleccionar un nuevo estado");
      return;
    }

    // Si es un estado crítico, mostrar confirmación
    if (estadosCriticos.includes(nuevoEstado) && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/reparaciones/${ordenId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          notas: notas || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Error al cambiar estado");
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNuevoEstado("");
    setNotas("");
    setError(null);
    setShowConfirmation(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cambiar Estado de Orden" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Orden Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Orden</p>
          <p className="font-semibold text-gray-900">{folio}</p>
        </div>

        {/* Estado Actual → Nuevo */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">Estado Actual</p>
            <EstadoBadge estado={estadoActual} />
          </div>

          <ArrowRight className="w-6 h-6 text-gray-400 mt-6" />

          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">Nuevo Estado</p>
            {nuevoEstado && <EstadoBadge estado={nuevoEstado} />}
          </div>
        </div>

        {/* Selector de Estado */}
        {estadosDisponibles.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              No hay transiciones disponibles desde el estado actual.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Nuevo Estado
            </label>
            <select
              value={nuevoEstado}
              onChange={(e) => {
                setNuevoEstado(e.target.value as EstadoOrdenReparacion);
                setShowConfirmation(false);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Seleccione un estado --</option>
              {estadosDisponibles.map((estado) => (
                <option key={estado} value={estado}>
                  {estadosLabels[estado]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas (opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Razón del cambio de estado, observaciones, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* Confirmación para estados críticos */}
        {showConfirmation && nuevoEstado && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 mb-1">
                  ¿Está seguro de cambiar al estado "{estadosLabels[nuevoEstado as EstadoOrdenReparacion]}"?
                </p>
                <p className="text-sm text-red-700">
                  Esta acción es irreversible y marcará la orden como finalizada sin completar
                  la reparación.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={showConfirmation ? "danger" : "primary"}
            disabled={loading || estadosDisponibles.length === 0}
            className="flex-1"
          >
            {loading ? "Procesando..." : showConfirmation ? "Confirmar Cambio" : "Cambiar Estado"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
