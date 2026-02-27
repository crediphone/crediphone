"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { OrdenReparacionDetallada, ParteReemplazada, AnticipoReparacion } from "@/types";
import { Plus, Trash2, AlertCircle } from "lucide-react";

interface ModalEditarPresupuestoProps {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenReparacionDetallada;
  onSuccess: () => void;
}

export function ModalEditarPresupuesto({
  isOpen,
  onClose,
  orden,
  onSuccess,
}: ModalEditarPresupuestoProps) {
  const [costoManoObra, setCostoManoObra] = useState(orden.costoReparacion || 0);
  const [partes, setPartes] = useState<ParteReemplazada[]>(
    orden.partesReemplazadas || []
  );
  const [anticipos, setAnticipos] = useState<AnticipoReparacion[]>([]);
  const [loadingAnticipos, setLoadingAnticipos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Resetear valores cuando se abre el modal
      setCostoManoObra(orden.costoReparacion || 0);
      setPartes(orden.partesReemplazadas || []);
      fetchAnticipos();
    }
  }, [isOpen, orden]);

  async function fetchAnticipos() {
    try {
      setLoadingAnticipos(true);
      const response = await fetch(`/api/reparaciones/${orden.id}/anticipos`);
      const result = await response.json();

      if (result.success) {
        setAnticipos(result.data || []);
      }
    } catch (error) {
      console.error("Error al cargar anticipos:", error);
      setAnticipos([]);
    } finally {
      setLoadingAnticipos(false);
    }
  }

  // Cálculos automáticos
  const costoPartes = partes.reduce(
    (sum, parte) => sum + (parte.costo || 0) * (parte.cantidad || 0),
    0
  );
  const costoTotal = costoManoObra + costoPartes;
  const totalAnticipos = anticipos.reduce((sum, a) => sum + a.monto, 0);
  const saldoPendiente = costoTotal - totalAnticipos;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  function handleAgregarParte() {
    setPartes([
      ...partes,
      { parte: "", costo: 0, cantidad: 1, proveedor: "" },
    ]);
  }

  function handleEliminarParte(index: number) {
    setPartes(partes.filter((_, i) => i !== index));
  }

  function handleActualizarParte(
    index: number,
    field: keyof ParteReemplazada,
    value: string | number
  ) {
    const nuevasPartes = [...partes];
    nuevasPartes[index] = { ...nuevasPartes[index], [field]: value };
    setPartes(nuevasPartes);
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (costoManoObra < 0) {
      errors.costoManoObra = "El costo no puede ser negativo";
    }

    // Validar que no se reduzca el total por debajo de anticipos pagados
    if (costoTotal < totalAnticipos) {
      errors.total = `El costo total (${formatCurrency(costoTotal)}) no puede ser menor que los anticipos pagados (${formatCurrency(totalAnticipos)})`;
    }

    // Validar partes
    partes.forEach((parte, index) => {
      if (!parte.parte.trim()) {
        errors[`parte_${index}`] = "El nombre de la parte es requerido";
      }
      if (parte.costo < 0) {
        errors[`costo_${index}`] = "El costo no puede ser negativo";
      }
      if (parte.cantidad <= 0) {
        errors[`cantidad_${index}`] = "La cantidad debe ser mayor a 0";
      }
    });

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Validar estado de la orden
    if (orden.estado === "entregado" || orden.estado === "cancelado") {
      setErrors({
        submit: "No se puede editar el presupuesto de una orden entregada o cancelada",
      });
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const payload = {
        diagnostico: {
          diagnosticoTecnico: orden.diagnosticoTecnico || "",
          costoReparacion: costoManoObra,
          costoPartes: costoPartes,
          partesReemplazadas: partes.filter((p) => p.parte.trim() !== ""),
          notasTecnico: orden.notasTecnico,
          requiereAprobacion: orden.requiereAprobacion,
        },
      };

      const response = await fetch(`/api/reparaciones/${orden.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar presupuesto");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al actualizar presupuesto:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Error al actualizar presupuesto",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Presupuesto - ${orden.folio}`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Costo de Mano de Obra */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Costo de Mano de Obra
          </label>
          <Input
            type="number"
            value={costoManoObra}
            onChange={(e) => setCostoManoObra(Number(e.target.value))}
            placeholder="0.00"
            min="0"
            step="0.01"
            error={errors.costoManoObra}
          />
        </div>

        {/* Lista de Partes */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Partes a Reemplazar
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAgregarParte}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Parte
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {partes.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">
                  No hay partes agregadas. Haz clic en "Agregar Parte" para comenzar.
                </p>
              </div>
            ) : (
              partes.map((parte, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg"
                >
                  {/* Nombre de la parte */}
                  <div className="col-span-4">
                    <Input
                      type="text"
                      value={parte.parte}
                      onChange={(e) =>
                        handleActualizarParte(index, "parte", e.target.value)
                      }
                      placeholder="Nombre de la parte"
                      error={errors[`parte_${index}`]}
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={parte.cantidad}
                      onChange={(e) =>
                        handleActualizarParte(index, "cantidad", Number(e.target.value))
                      }
                      placeholder="Cant."
                      min="1"
                      error={errors[`cantidad_${index}`]}
                    />
                  </div>

                  {/* Costo */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={parte.costo}
                      onChange={(e) =>
                        handleActualizarParte(index, "costo", Number(e.target.value))
                      }
                      placeholder="Costo"
                      min="0"
                      step="0.01"
                      error={errors[`costo_${index}`]}
                    />
                  </div>

                  {/* Proveedor */}
                  <div className="col-span-3">
                    <Input
                      type="text"
                      value={parte.proveedor || ""}
                      onChange={(e) =>
                        handleActualizarParte(index, "proveedor", e.target.value)
                      }
                      placeholder="Proveedor (opcional)"
                    />
                  </div>

                  {/* Botón Eliminar */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleEliminarParte(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resumen de Costos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900 mb-3">Resumen de Costos</h3>

          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Mano de Obra:</span>
            <span className="font-medium">{formatCurrency(costoManoObra)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Partes ({partes.length}):</span>
            <span className="font-medium">{formatCurrency(costoPartes)}</span>
          </div>

          <div className="border-t border-blue-300 pt-2 mt-2">
            <div className="flex justify-between text-base font-semibold">
              <span className="text-gray-900">Costo Total:</span>
              <span className="text-blue-600">{formatCurrency(costoTotal)}</span>
            </div>
          </div>

          {anticipos.length > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Anticipos Recibidos:</span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(totalAnticipos)}
                </span>
              </div>

              <div className="border-t border-blue-300 pt-2 mt-2">
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-gray-900">Saldo Pendiente:</span>
                  <span
                    className={
                      saldoPendiente > 0 ? "text-orange-600" : "text-green-600"
                    }
                  >
                    {formatCurrency(saldoPendiente)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Advertencias */}
        {orden.aprobadoPorCliente && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  Presupuesto Ya Aprobado
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Este presupuesto fue aprobado por el cliente. Modificarlo puede
                  requerir una nueva aprobación.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error de Validación */}
        {errors.total && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{errors.total}</p>
          </div>
        )}

        {/* Error General */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{errors.submit}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? "Guardando..." : "Guardar Presupuesto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
