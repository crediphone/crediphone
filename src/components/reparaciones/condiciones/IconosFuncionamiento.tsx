"use client";

import { CondicionesFuncionamiento } from "@/types";

interface IconosFuncionamientoProps {
  condiciones: CondicionesFuncionamiento;
  onChange: (nuevasCondiciones: CondicionesFuncionamiento) => void;
}

const COMPONENTES_FUNCIONAMIENTO = [
  { key: "bateria", icono: "🔋", nombre: "Batería" },
  { key: "pantallaTactil", icono: "📱", nombre: "Pantalla/Táctil" },
  { key: "camaras", icono: "📷", nombre: "Cámaras" },
  { key: "microfono", icono: "🎤", nombre: "Micrófono" },
  { key: "altavoz", icono: "🔊", nombre: "Altavoz" },
  { key: "bluetooth", icono: "📡", nombre: "Bluetooth" },
  { key: "wifi", icono: "📶", nombre: "WiFi" },
  { key: "botonEncendido", icono: "⏻", nombre: "Power" },
  { key: "botonesVolumen", icono: "🔉", nombre: "Volumen" },
  { key: "sensorHuella", icono: "👤", nombre: "Huella" },
] as const;

export function IconosFuncionamiento({
  condiciones,
  onChange,
}: IconosFuncionamientoProps) {
  const toggle = (key: keyof CondicionesFuncionamiento) => {
    if (isCheckboxKey(key)) {
      return;
    }

    const nuevoEstado = condiciones[key] === "ok" ? "falla" : "ok";
    onChange({ ...condiciones, [key]: nuevoEstado });
  };

  const toggleCheckbox = (key: keyof CondicionesFuncionamiento) => {
    onChange({ ...condiciones, [key]: !condiciones[key] });
  };

  const isCheckboxKey = (key: string): boolean => {
    return ["llegaApagado", "estaMojado", "bateriaHinchada"].includes(key);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <span>⚡</span>
        <span>Funcionamiento de Componentes</span>
      </h3>

      <div className="grid grid-cols-4 gap-2">
        {COMPONENTES_FUNCIONAMIENTO.map((comp) => {
          const estado = condiciones[comp.key as keyof CondicionesFuncionamiento];
          const esOk = estado === "ok";

          return (
            <button
              key={comp.key}
              type="button"
              onClick={() => toggle(comp.key as keyof CondicionesFuncionamiento)}
              className={`
                p-2 rounded-lg border-2 transition-all text-center
                hover:shadow-md active:scale-95
                ${
                  esOk
                    ? "bg-green-50 border-green-500 hover:bg-green-100"
                    : "bg-red-50 border-red-500 hover:bg-red-100"
                }
              `}
            >
              <div className="text-2xl mb-1">{comp.icono}</div>
              <div className="text-[10px] font-semibold text-gray-700 leading-tight">
                {comp.nombre}
              </div>
              <div
                className={`
                w-2 h-2 rounded-full mx-auto mt-1.5
                ${esOk ? "bg-green-500" : "bg-red-500"}
              `}
              />
            </button>
          );
        })}
      </div>

      {/* Checkboxes especiales - condiciones críticas */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="text-xs font-semibold text-yellow-800 mb-2">
          ⚠️ Condiciones Especiales
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <label className="flex items-center gap-2 cursor-pointer hover:text-yellow-900">
            <input
              type="checkbox"
              checked={condiciones.llegaApagado || false}
              onChange={() => toggleCheckbox("llegaApagado")}
              className="w-4 h-4 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="font-medium">🔌 Llega apagado</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-yellow-900">
            <input
              type="checkbox"
              checked={condiciones.estaMojado || false}
              onChange={() => toggleCheckbox("estaMojado")}
              className="w-4 h-4 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="font-medium">💧 Mojado / Líquido</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-yellow-900">
            <input
              type="checkbox"
              checked={condiciones.bateriaHinchada || false}
              onChange={() => toggleCheckbox("bateriaHinchada")}
              className="w-4 h-4 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
            />
            <span className="font-medium">⚠️ Batería hinchada</span>
          </label>
        </div>
      </div>

      {/* Indicador de fallas */}
      {(() => {
        const fallas = COMPONENTES_FUNCIONAMIENTO.filter(
          (comp) =>
            condiciones[comp.key as keyof CondicionesFuncionamiento] === "falla"
        );
        const condicionesEspeciales = [
          condiciones.llegaApagado && "Apagado",
          condiciones.estaMojado && "Mojado",
          condiciones.bateriaHinchada && "Batería hinchada",
        ].filter(Boolean);

        if (fallas.length === 0 && condicionesEspeciales.length === 0) {
          return (
            <div className="text-xs text-green-600 bg-green-50 border border-green-200 rounded p-2 text-center">
              ✓ Todos los componentes funcionan correctamente
            </div>
          );
        }

        return (
          <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">
            <div className="font-semibold mb-1">Componentes con problemas:</div>
            <div className="flex flex-wrap gap-1">
              {fallas.map((comp) => (
                <span
                  key={comp.key}
                  className="bg-red-100 text-red-700 px-2 py-0.5 rounded"
                >
                  {comp.nombre}
                </span>
              ))}
              {condicionesEspeciales.map((cond, idx) => (
                <span
                  key={idx}
                  className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded"
                >
                  {cond}
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
