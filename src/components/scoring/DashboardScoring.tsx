"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface ScoringData {
  id: string;
  cliente_id: string;
  puntaje_total: number;
  puntaje_historial_pagos: number;
  puntaje_antiguedad: number;
  puntaje_referencias: number;
  puntaje_capacidad_pago: number;
  puntaje_documentacion: number;
  nivel_riesgo: "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO" | "SIN_EVALUAR";
  limite_credito_sugerido: number;
  enganche_minimo_sugerido: number;
  tasa_interes_sugerida: number;
  plazo_maximo_sugerido: number;
  ultima_actualizacion: string;
}

interface DashboardScoringProps {
  clienteId: string;
}

const FACTOR_INFO = {
  historial_pagos: { label: "Historial de Pagos", max: 40, icon: "📊" },
  antiguedad: { label: "Antigüedad", max: 15, icon: "⏳" },
  referencias: { label: "Referencias", max: 15, icon: "👥" },
  capacidad_pago: { label: "Capacidad de Pago", max: 20, icon: "💰" },
  documentacion: { label: "Documentación", max: 10, icon: "📄" },
};

const NIVEL_RIESGO_CONFIG = {
  BAJO: { color: "green", bg: "bg-green-100", text: "text-green-800", border: "border-green-500", label: "Riesgo Bajo" },
  MEDIO: { color: "yellow", bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-500", label: "Riesgo Medio" },
  ALTO: { color: "orange", bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-500", label: "Riesgo Alto" },
  MUY_ALTO: { color: "red", bg: "bg-red-100", text: "text-red-800", border: "border-red-500", label: "Riesgo Muy Alto" },
  SIN_EVALUAR: { color: "gray", bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-500", label: "Sin Evaluar" },
};

export function DashboardScoring({ clienteId }: DashboardScoringProps) {
  const [scoring, setScoring] = useState<ScoringData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [recalculando, setRecalculando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarScoring = async () => {
    try {
      setCargando(true);
      setError(null);

      console.log("Cargando scoring para cliente:", clienteId);
      const res = await fetch(`/api/scoring/${clienteId}`);

      console.log("Response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Error al cargar scoring");
      }

      const data = await res.json();
      console.log("Scoring data:", data);
      setScoring(data);
    } catch (err) {
      console.error("Error completo:", err);
      setError(err instanceof Error ? err.message : "No se pudo cargar el scoring");
    } finally {
      setCargando(false);
    }
  };

  const recalcularScoring = async () => {
    try {
      setRecalculando(true);
      const res = await fetch(`/api/scoring/${clienteId}/recalcular`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Error al recalcular scoring");
      }

      const result = await res.json();
      setScoring(result.scoring);
    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo recalcular el scoring");
    } finally {
      setRecalculando(false);
    }
  };

  useEffect(() => {
    cargarScoring();
  }, [clienteId]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Cargando scoring...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm font-semibold mb-2">❌ Error</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-xs">
            💡 <strong>Posibles causas:</strong>
          </p>
          <ul className="text-yellow-700 text-xs mt-2 ml-4 list-disc space-y-1">
            <li>La función de scoring no está disponible en la base de datos</li>
            <li>Verifica que ejecutaste el script SQL de FASE 5</li>
            <li>Revisa los logs del servidor para más detalles</li>
          </ul>
        </div>
        <button
          onClick={() => {
            setError(null);
            cargarScoring();
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  if (!scoring) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center space-y-4">
        <div className="text-6xl">📊</div>
        <p className="text-gray-600 mb-4">Este cliente aún no tiene scoring calculado</p>
        <p className="text-sm text-gray-500">
          El scoring se calculará automáticamente basándose en el historial del cliente
        </p>
        <button
          onClick={recalcularScoring}
          disabled={recalculando}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {recalculando ? "⏳ Calculando..." : "📊 Calcular Scoring"}
        </button>
      </div>
    );
  }

  const riesgoConfig = NIVEL_RIESGO_CONFIG[scoring.nivel_riesgo];
  const porcentajeTotal = scoring.puntaje_total;

  return (
    <div className="space-y-6">
      {/* Header con botón de recalcular */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Análisis Crediticio</h3>
        <button
          onClick={recalcularScoring}
          disabled={recalculando}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {recalculando ? "⏳ Recalculando..." : "🔄 Recalcular"}
        </button>
      </div>

      {/* Puntaje Total - Gauge Visual */}
      <div className={`border-2 ${riesgoConfig.border} rounded-xl p-6 ${riesgoConfig.bg}`}>
        <div className="text-center mb-4">
          <div className="text-6xl font-bold" style={{ color: riesgoConfig.color }}>
            {scoring.puntaje_total}
          </div>
          <div className="text-sm text-gray-600 mt-1">de 100 puntos</div>
        </div>

        {/* Barra de progreso circular visual */}
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div
            className="absolute h-full transition-all duration-500"
            style={{
              width: `${porcentajeTotal}%`,
              backgroundColor: riesgoConfig.color,
            }}
          />
        </div>

        {/* Badge de nivel de riesgo */}
        <div className="text-center">
          <span className={`inline-block px-4 py-2 rounded-lg font-semibold ${riesgoConfig.bg} ${riesgoConfig.text} border ${riesgoConfig.border}`}>
            {riesgoConfig.label}
          </span>
        </div>
      </div>

      {/* Desglose por Factores */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Desglose por Factor</h4>
        <div className="space-y-4">
          {Object.entries(FACTOR_INFO).map(([key, info]) => {
            const puntaje = scoring[`puntaje_${key}` as keyof ScoringData] as number;
            const porcentaje = (puntaje / info.max) * 100;

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">
                    {info.icon} {info.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {puntaje} / {info.max}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Términos Sugeridos */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">💡 Términos Sugeridos</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Límite de Crédito</div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(scoring.limite_credito_sugerido)}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Enganche Mínimo</div>
            <div className="text-lg font-bold text-gray-900">
              {scoring.enganche_minimo_sugerido}%
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Tasa de Interés</div>
            <div className="text-lg font-bold text-gray-900">
              {scoring.tasa_interes_sugerida.toFixed(1)}%
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Plazo Máximo</div>
            <div className="text-lg font-bold text-gray-900">
              {scoring.plazo_maximo_sugerido} meses
            </div>
          </div>
        </div>
      </div>

      {/* Última actualización */}
      <div className="text-xs text-gray-500 text-center">
        Última actualización: {new Date(scoring.ultima_actualizacion).toLocaleString("es-MX")}
      </div>
    </div>
  );
}
