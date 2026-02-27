"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { TipoPago, DesglosePagoMixto } from "@/types";
import { DollarSign, AlertCircle } from "lucide-react";

interface ModalAgregarAnticipoProps {
  isOpen: boolean;
  onClose: () => void;
  ordenId: string;
  ordenFolio: string;
  saldoPendiente: number;
  onSuccess: () => void;
}

export function ModalAgregarAnticipo({
  isOpen,
  onClose,
  ordenId,
  ordenFolio,
  saldoPendiente,
  onSuccess,
}: ModalAgregarAnticipoProps) {
  const [monto, setMonto] = useState<number>(0);
  const [tipoPago, setTipoPago] = useState<TipoPago>("efectivo");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [notas, setNotas] = useState("");

  // Desglose para pago mixto
  const [desgloseMixto, setDesgloseMixto] = useState<DesglosePagoMixto>({
    efectivo: 0,
    transferencia: 0,
    tarjeta: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Resetear form cuando se abre
      setMonto(0);
      setTipoPago("efectivo");
      setReferenciaPago("");
      setNotas("");
      setDesgloseMixto({ efectivo: 0, transferencia: 0, tarjeta: 0 });
      setErrors({});
    }
  }, [isOpen]);

  // Auto-calcular monto cuando es pago mixto
  useEffect(() => {
    if (tipoPago === "mixto") {
      const total =
        (desgloseMixto.efectivo || 0) +
        (desgloseMixto.transferencia || 0) +
        (desgloseMixto.tarjeta || 0);
      setMonto(total);
    }
  }, [tipoPago, desgloseMixto]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(value);
  };

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (monto <= 0) {
      errors.monto = "El monto debe ser mayor a 0";
    }

    if (monto > saldoPendiente) {
      errors.monto = `El anticipo (${formatCurrency(monto)}) no puede exceder el saldo pendiente (${formatCurrency(saldoPendiente)})`;
    }

    // Validar desglose mixto
    if (tipoPago === "mixto") {
      const totalDesglose =
        (desgloseMixto.efectivo || 0) +
        (desgloseMixto.transferencia || 0) +
        (desgloseMixto.tarjeta || 0);

      if (totalDesglose <= 0) {
        errors.desglose = "Debe especificar al menos un método de pago";
      }
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const payload = {
        monto,
        tipoPago,
        desgloseMixto: tipoPago === "mixto" ? desgloseMixto : undefined,
        referenciaPago: referenciaPago || undefined,
        notas: notas || undefined,
      };

      const response = await fetch(`/api/reparaciones/${ordenId}/anticipos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Error al registrar anticipo");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al agregar anticipo:", error);
      setErrors({
        submit:
          error instanceof Error ? error.message : "Error al registrar anticipo",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Agregar Anticipo - ${ordenFolio}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info del Saldo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-700">Saldo Pendiente</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(saldoPendiente)}
              </p>
            </div>
          </div>
        </div>

        {/* Tipo de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Pago
          </label>
          <select
            value={tipoPago}
            onChange={(e) => setTipoPago(e.target.value as TipoPago)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="mixto">Pago Mixto</option>
          </select>
        </div>

        {/* Monto o Desglose Mixto */}
        {tipoPago === "mixto" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desglose de Pago Mixto
            </label>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Efectivo
                </label>
                <Input
                  type="number"
                  value={desgloseMixto.efectivo || 0}
                  onChange={(e) =>
                    setDesgloseMixto({
                      ...desgloseMixto,
                      efectivo: Number(e.target.value),
                    })
                  }
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Transferencia
                </label>
                <Input
                  type="number"
                  value={desgloseMixto.transferencia || 0}
                  onChange={(e) =>
                    setDesgloseMixto({
                      ...desgloseMixto,
                      transferencia: Number(e.target.value),
                    })
                  }
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Tarjeta
                </label>
                <Input
                  type="number"
                  value={desgloseMixto.tarjeta || 0}
                  onChange={(e) =>
                    setDesgloseMixto({
                      ...desgloseMixto,
                      tarjeta: Number(e.target.value),
                    })
                  }
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="border-t border-gray-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Total:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(monto)}
                  </span>
                </div>
              </div>
            </div>
            {errors.desglose && (
              <p className="mt-1 text-sm text-red-600">{errors.desglose}</p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto del Anticipo
            </label>
            <Input
              type="number"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              min="0"
              step="0.01"
              placeholder="0.00"
              error={errors.monto}
              required
            />
          </div>
        )}

        {/* Referencia de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referencia de Pago (Opcional)
          </label>
          <Input
            type="text"
            value={referenciaPago}
            onChange={(e) => setReferenciaPago(e.target.value)}
            placeholder="Ej: Últimos 4 dígitos, número de transacción"
          />
          <p className="mt-1 text-xs text-gray-500">
            Para tarjetas: últimos 4 dígitos. Para transferencias: número de
            operación
          </p>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas (Opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Observaciones sobre el pago"
          />
        </div>

        {/* Advertencia si excede el saldo */}
        {monto > saldoPendiente && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  El monto excede el saldo pendiente
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  El anticipo de {formatCurrency(monto)} es mayor que el saldo
                  pendiente de {formatCurrency(saldoPendiente)}
                </p>
              </div>
            </div>
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
            {submitting ? "Registrando..." : "Registrar Anticipo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
