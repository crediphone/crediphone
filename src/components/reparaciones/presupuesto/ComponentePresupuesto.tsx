"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Calculator,
  Wallet,
  CreditCard,
  Banknote,
  Split,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { TipoPago, DesglosePagoMixto } from "@/types";

interface Anticipo {
  id: string;
  monto: number;
  tipoPago: TipoPago;
  desgloseMixto?: DesglosePagoMixto;
  referenciaPago?: string;
  notas?: string;
}

interface ComponentePresupuestoProps {
  presupuestoTotal: number;
  anticipos: Anticipo[];
  onChange: (data: {
    presupuestoTotal: number;
    anticipos: Anticipo[];
  }) => void;
}

export function ComponentePresupuesto({
  presupuestoTotal,
  anticipos,
  onChange,
}: ComponentePresupuestoProps) {
  const [mostrandoNuevoAnticipo, setMostrandoNuevoAnticipo] = useState(false);
  const [nuevoAnticipo, setNuevoAnticipo] = useState<Partial<Anticipo>>({
    tipoPago: "efectivo",
    monto: 0,
  });

  // Cálculos automáticos
  const totalAnticipos = anticipos.reduce((sum, a) => sum + a.monto, 0);
  const saldoPendiente = presupuestoTotal - totalAnticipos;

  const handlePresupuestoChange = (value: number) => {
    onChange({
      presupuestoTotal: value,
      anticipos,
    });
  };

  const agregarAnticipo = () => {
    if (!nuevoAnticipo.monto || nuevoAnticipo.monto <= 0) {
      alert("Ingresa un monto válido para el anticipo");
      return;
    }

    if (nuevoAnticipo.monto > saldoPendiente) {
      alert(
        `El anticipo no puede ser mayor al saldo pendiente ($${saldoPendiente.toFixed(2)})`
      );
      return;
    }

    const anticipo: Anticipo = {
      id: `temp-${Date.now()}`,
      monto: nuevoAnticipo.monto || 0,
      tipoPago: nuevoAnticipo.tipoPago || "efectivo",
      desgloseMixto: nuevoAnticipo.desgloseMixto,
      referenciaPago: nuevoAnticipo.referenciaPago,
      notas: nuevoAnticipo.notas,
    };

    onChange({
      presupuestoTotal,
      anticipos: [...anticipos, anticipo],
    });

    setNuevoAnticipo({ tipoPago: "efectivo", monto: 0 });
    setMostrandoNuevoAnticipo(false);
  };

  const eliminarAnticipo = (id: string) => {
    onChange({
      presupuestoTotal,
      anticipos: anticipos.filter((a) => a.id !== id),
    });
  };

  const getTipoPagoIcon = (tipo: TipoPago) => {
    switch (tipo) {
      case "efectivo":
        return <Banknote className="w-4 h-4" />;
      case "tarjeta":
        return <CreditCard className="w-4 h-4" />;
      case "transferencia":
        return <Wallet className="w-4 h-4" />;
      case "mixto":
        return <Split className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* HEADER CON GRADIENTE */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-2xl">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
        <div className="relative flex items-center gap-3">
          <div className="rounded-full bg-white/20 p-3 backdrop-blur-md">
            <DollarSign className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Presupuesto</h3>
            <p className="text-sm text-white/80">
              Costo total y anticipos de la reparación
            </p>
          </div>
        </div>
      </div>

      {/* PRESUPUESTO TOTAL */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="group relative overflow-hidden rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-lg transition-all hover:shadow-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-100 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-600">
              <Calculator className="h-6 w-6" />
            </div>
            <label className="text-lg font-bold text-gray-800">
              Presupuesto Total
            </label>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">
              $
            </span>
            <input
              type="number"
              value={presupuestoTotal || ""}
              onChange={(e) =>
                handlePresupuestoChange(parseFloat(e.target.value) || 0)
              }
              onWheel={(e) => e.currentTarget.blur()}
              className="w-full rounded-xl border-2 border-emerald-300 bg-white pl-12 pr-6 py-4 text-2xl font-bold text-gray-800 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Incluye mano de obra, piezas y cualquier otro costo
          </p>
        </div>
      </motion.div>

      {/* RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium">Anticipos Recibidos</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            ${totalAnticipos.toFixed(2)}
          </p>
        </div>

        <div
          className={`rounded-lg border-2 p-4 ${
            saldoPendiente > 0
              ? "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50"
              : "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
          }`}
        >
          <div
            className={`flex items-center gap-2 mb-1 ${
              saldoPendiente > 0 ? "text-orange-600" : "text-green-600"
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Saldo Pendiente</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              saldoPendiente > 0 ? "text-orange-700" : "text-green-700"
            }`}
          >
            ${saldoPendiente.toFixed(2)}
          </p>
        </div>
      </div>

      {/* ANTICIPOS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Anticipos Recibidos
            <span className="text-xs font-normal text-gray-500">
              ({anticipos.length})
            </span>
          </h4>
          {!mostrandoNuevoAnticipo && saldoPendiente > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMostrandoNuevoAnticipo(true)}
              type="button"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              <Plus className="h-4 w-4" />
              Agregar Anticipo
            </motion.button>
          )}
        </div>

        {/* LISTA DE ANTICIPOS */}
        <AnimatePresence>
          {anticipos.map((anticipo, index) => (
            <motion.div
              key={anticipo.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 shadow-md transition-all hover:border-emerald-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                    {getTipoPagoIcon(anticipo.tipoPago)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Anticipo #{index + 1}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {anticipo.tipoPago}
                      {anticipo.referenciaPago && ` • ${anticipo.referenciaPago}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold text-emerald-600">
                    ${anticipo.monto.toFixed(2)}
                  </p>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => eliminarAnticipo(anticipo.id)}
                    className="rounded-lg bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
              {anticipo.notas && (
                <p className="mt-2 text-xs text-gray-600">{anticipo.notas}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* FORMULARIO NUEVO ANTICIPO */}
        <AnimatePresence>
          {mostrandoNuevoAnticipo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-lg"
            >
              <h5 className="mb-4 text-sm font-bold text-emerald-800">
                Nuevo Anticipo
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Monto
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500">
                      $
                    </span>
                    <input
                      type="number"
                      value={nuevoAnticipo.monto || ""}
                      onChange={(e) =>
                        setNuevoAnticipo({
                          ...nuevoAnticipo,
                          monto: parseFloat(e.target.value) || 0,
                        })
                      }
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white pl-8 pr-4 py-2.5 font-bold transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      max={saldoPendiente}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Tipo de Pago
                  </label>
                  <select
                    value={nuevoAnticipo.tipoPago}
                    onChange={(e) =>
                      setNuevoAnticipo({
                        ...nuevoAnticipo,
                        tipoPago: e.target.value as TipoPago,
                      })
                    }
                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 font-semibold transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="mixto">🔀 Mixto</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Referencia (opcional)
                  </label>
                  <input
                    type="text"
                    value={nuevoAnticipo.referenciaPago || ""}
                    onChange={(e) =>
                      setNuevoAnticipo({
                        ...nuevoAnticipo,
                        referenciaPago: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Núm. transacción, últimos 4 dígitos..."
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={agregarAnticipo}
                  className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                >
                  Guardar Anticipo
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setMostrandoNuevoAnticipo(false);
                    setNuevoAnticipo({ tipoPago: "efectivo", monto: 0 });
                  }}
                  className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-all hover:bg-gray-50"
                >
                  Cancelar
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EMPTY STATE */}
        {anticipos.length === 0 && !mostrandoNuevoAnticipo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center"
          >
            <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm font-semibold text-gray-600 mb-1">
              No hay anticipos registrados
            </p>
            <p className="text-xs text-gray-500">
              Agrega el primer anticipo para comenzar
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
