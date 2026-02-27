"use client";

import { EstadoFisicoDispositivo, EstadoFisico } from "@/types";

interface IconosEstadoFisicoProps {
  estadoFisico: EstadoFisicoDispositivo;
  onChange: (nuevoEstado: EstadoFisicoDispositivo) => void;
}

const PARTES_FISICAS = [
  { key: "marco", icono: "🔲", nombre: "Marco" },
  { key: "bisel", icono: "🔳", nombre: "Bisel" },
  { key: "pantallaFisica", icono: "💎", nombre: "Cristal" },
  { key: "camaraLente", icono: "📷", nombre: "Cámara" },
  { key: "tapaTrasera", icono: "📱", nombre: "Tapa" },
] as const;

const ESTADOS_CONFIG: Record<
  EstadoFisico,
  { emoji: string; label: string; bgColor: string; borderColor: string }
> = {
  perfecto: {
    emoji: "🟢",
    label: "Perfecto",
    bgColor: "bg-green-50",
    borderColor: "border-green-400",
  },
  rallado: {
    emoji: "🟡",
    label: "Rallado",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-400",
  },
  golpeado: {
    emoji: "🟠",
    label: "Golpeado",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-400",
  },
  quebrado: {
    emoji: "🔴",
    label: "Quebrado",
    bgColor: "bg-red-50",
    borderColor: "border-red-400",
  },
};

const ESTADOS_ORDEN: EstadoFisico[] = ["perfecto", "rallado", "golpeado", "quebrado"];

export function IconosEstadoFisico({
  estadoFisico,
  onChange,
}: IconosEstadoFisicoProps) {
  const toggleEstado = (key: keyof EstadoFisicoDispositivo) => {
    if (key === "tieneSIM" || key === "tieneMemoriaSD" || key === "observacionesFisicas") {
      return;
    }

    const estadoActual = estadoFisico[key] as EstadoFisico;
    const indexActual = ESTADOS_ORDEN.indexOf(estadoActual);
    const siguienteIndex = (indexActual + 1) % ESTADOS_ORDEN.length;
    const nuevoEstado = ESTADOS_ORDEN[siguienteIndex];

    onChange({ ...estadoFisico, [key]: nuevoEstado });
  };

  const toggleCheckbox = (key: "tieneSIM" | "tieneMemoriaSD") => {
    onChange({ ...estadoFisico, [key]: !estadoFisico[key] });
  };

  const tieneProblemasFisicos = (): boolean => {
    return PARTES_FISICAS.some((parte) => {
      const estado = estadoFisico[parte.key as keyof EstadoFisicoDispositivo];
      return typeof estado === "string" && estado !== "perfecto";
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <span>📦</span>
        <span>Cómo Llega el Equipo (Estado Físico)</span>
      </h3>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
        ℹ️ Click en cada parte para cambiar el estado:{" "}
        <span className="font-semibold">
          Perfecto → Rallado → Golpeado → Quebrado → Perfecto
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {PARTES_FISICAS.map((parte) => {
          const estado = estadoFisico[
            parte.key as keyof EstadoFisicoDispositivo
          ] as EstadoFisico;
          const estadoInfo = ESTADOS_CONFIG[estado];

          return (
            <button
              key={parte.key}
              type="button"
              onClick={() => toggleEstado(parte.key as keyof EstadoFisicoDispositivo)}
              className={`
                p-2 rounded-lg border-2 transition-all
                hover:shadow-md active:scale-95
                ${estadoInfo.bgColor} ${estadoInfo.borderColor}
              `}
            >
              <div className="text-2xl mb-1">{parte.icono}</div>
              <div className="text-[10px] font-semibold text-gray-700 leading-tight mb-1">
                {parte.nombre}
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg">{estadoInfo.emoji}</span>
                <span className="text-[9px] font-medium text-gray-600">
                  {estadoInfo.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* SIM y SD como checkboxes compactos */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-200">
          <input
            type="checkbox"
            checked={estadoFisico.tieneSIM}
            onChange={() => toggleCheckbox("tieneSIM")}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium">📇 Entrega SIM</span>
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-200">
          <input
            type="checkbox"
            checked={estadoFisico.tieneMemoriaSD}
            onChange={() => toggleCheckbox("tieneMemoriaSD")}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium">💾 Entrega SD</span>
        </label>
      </div>

      {/* Campo de observaciones adicionales */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Observaciones adicionales (opcional)
        </label>
        <textarea
          value={estadoFisico.observacionesFisicas || ""}
          onChange={(e) =>
            onChange({ ...estadoFisico, observacionesFisicas: e.target.value })
          }
          placeholder="Ej: Rayón profundo en esquina superior derecha del marco..."
          rows={2}
          className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Indicador visual si hay daños */}
      {tieneProblemasFisicos() ? (
        <div className="text-xs bg-orange-50 border border-orange-200 rounded p-2 flex items-start gap-2">
          <span className="text-orange-600 text-base">⚠️</span>
          <div>
            <div className="font-semibold text-orange-800 mb-1">
              Daños físicos detectados
            </div>
            <div className="text-orange-700">
              Se registrará en el historial para referencia. Si los daños son
              relevantes para la reparación, se incluirán en el contrato PDF.
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded p-2 text-center">
          ✓ El dispositivo llega en perfecto estado físico
        </div>
      )}
    </div>
  );
}
