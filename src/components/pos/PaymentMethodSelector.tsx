"use client";

import { useState, useEffect } from "react";
import { DollarSign, CreditCard, ArrowRightLeft, Banknote } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import type { MetodoPagoVenta, DesglosePagoMixtoVenta } from "@/types";

interface PaymentData {
  metodoPago: MetodoPagoVenta;
  montoRecibido?: number;
  cambio?: number;
  referenciaPago?: string;
  desgloseMixto?: DesglosePagoMixtoVenta;
  isValid: boolean;
  errorMessage?: string;
}

interface PaymentMethodSelectorProps {
  total: number;
  onChange: (paymentData: PaymentData) => void;
}

export function PaymentMethodSelector({
  total,
  onChange,
}: PaymentMethodSelectorProps) {
  const [metodoPago, setMetodoPago] = useState<MetodoPagoVenta>("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [referencia, setReferencia] = useState("");

  // Para pago mixto
  const [mixtoEfectivo, setMixtoEfectivo] = useState("");
  const [mixtoTransferencia, setMixtoTransferencia] = useState("");
  const [mixtoTarjeta, setMixtoTarjeta] = useState("");

  const validatePayment = (): PaymentData => {
    let isValid = false;
    let errorMessage: string | undefined;
    let montoRecibidoNum: number | undefined;
    let cambio: number | undefined;
    let desgloseMixto: DesglosePagoMixtoVenta | undefined;

    if (metodoPago === "efectivo") {
      montoRecibidoNum = parseFloat(montoRecibido) || 0;
      if (montoRecibidoNum >= total) {
        cambio = montoRecibidoNum - total;
        isValid = true;
      } else {
        errorMessage = "El monto recibido debe ser mayor o igual al total";
      }
    } else if (metodoPago === "tarjeta" || metodoPago === "transferencia") {
      isValid = true; // Referencia es opcional
    } else if (metodoPago === "mixto") {
      const efectivo = parseFloat(mixtoEfectivo) || 0;
      const transferencia = parseFloat(mixtoTransferencia) || 0;
      const tarjeta = parseFloat(mixtoTarjeta) || 0;
      const sumaMixto = efectivo + transferencia + tarjeta;

      desgloseMixto = {
        efectivo: efectivo > 0 ? efectivo : undefined,
        transferencia: transferencia > 0 ? transferencia : undefined,
        tarjeta: tarjeta > 0 ? tarjeta : undefined,
      };

      if (Math.abs(sumaMixto - total) < 0.01) {
        isValid = true;
      } else {
        errorMessage = `La suma debe ser igual al total ($${total.toFixed(2)}). Suma actual: $${sumaMixto.toFixed(2)}`;
      }
    }

    return {
      metodoPago,
      montoRecibido: montoRecibidoNum,
      cambio,
      referenciaPago: referencia || undefined,
      desgloseMixto,
      isValid,
      errorMessage,
    };
  };

  // Validar y notificar cambios
  useEffect(() => {
    const paymentData = validatePayment();
    onChange(paymentData);
  }, [
    metodoPago,
    montoRecibido,
    referencia,
    mixtoEfectivo,
    mixtoTransferencia,
    mixtoTarjeta,
    total,
  ]);

  const tabs = [
    {
      id: "efectivo",
      label: "Efectivo",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto recibido *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          {montoRecibido && parseFloat(montoRecibido) >= total && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Cambio:</span>{" "}
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${(parseFloat(montoRecibido) - total).toFixed(2)}
                </span>
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "tarjeta",
      label: "Tarjeta",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Últimos 4 dígitos (opcional)
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                maxLength={4}
                value={referencia}
                onChange={(e) => setReferencia(e.target.value.replace(/\D/g, ""))}
                placeholder="1234"
                className="pl-10"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Total a cobrar:{" "}
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ${total.toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "transferencia",
      label: "Transferencia",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de referencia (opcional)
            </label>
            <div className="relative">
              <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="REF123456"
                className="pl-10"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Total a recibir:{" "}
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ${total.toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "mixto",
      label: "Mixto",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            La suma debe ser igual al total: ${total.toFixed(2)}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Efectivo
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={mixtoEfectivo}
                onChange={(e) => setMixtoEfectivo(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transferencia
            </label>
            <div className="relative">
              <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={mixtoTransferencia}
                onChange={(e) => setMixtoTransferencia(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tarjeta
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={mixtoTarjeta}
                onChange={(e) => setMixtoTarjeta(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          {/* Resumen de suma */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Suma:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                $
                {(
                  (parseFloat(mixtoEfectivo) || 0) +
                  (parseFloat(mixtoTransferencia) || 0) +
                  (parseFloat(mixtoTarjeta) || 0)
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-gray-700 dark:text-gray-300">Total requerido:</span>
              <span className="text-blue-600 dark:text-blue-400">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const paymentData = validatePayment();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Método de Pago
      </h3>

      <Tabs
        tabs={tabs}
        defaultTab={metodoPago}
        onTabChange={(id) => {
          setMetodoPago(id as MetodoPagoVenta);
          setReferencia("");
          setMontoRecibido("");
          setMixtoEfectivo("");
          setMixtoTransferencia("");
          setMixtoTarjeta("");
        }}
      />

      {/* Error message */}
      {paymentData.errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            {paymentData.errorMessage}
          </p>
        </div>
      )}
    </div>
  );
}
