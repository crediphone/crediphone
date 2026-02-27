"use client";

import { useState, useEffect } from "react";
import { MapPin, Package } from "lucide-react";
import type { UbicacionInventario } from "@/types";

interface LocationSelectorProps {
  value?: string;
  onChange: (ubicacionId: string | undefined) => void;
  showAllOption?: boolean;
  disabled?: boolean;
  showCounts?: boolean;
}

export function LocationSelector({
  value,
  onChange,
  showAllOption = true,
  disabled = false,
  showCounts = false,
}: LocationSelectorProps) {
  const [ubicaciones, setUbicaciones] = useState<
    Array<UbicacionInventario & { productosCount?: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUbicaciones();
  }, [showCounts]);

  const fetchUbicaciones = async () => {
    try {
      setLoading(true);
      const url = showCounts
        ? "/api/inventario/ubicaciones?withCounts=true"
        : "/api/inventario/ubicaciones";

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setUbicaciones(data.data);
      }
    } catch (error) {
      console.error("Error fetching ubicaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      estante: "Estante",
      vitrina: "Vitrina",
      bodega: "Bodega",
      mostrador: "Mostrador",
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, string> = {
      estante: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      vitrina: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      bodega: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
      mostrador: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    };
    return colors[tipo] || colors.estante;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Cargando ubicaciones...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <MapPin className="w-4 h-4 inline mr-1" />
        Ubicación
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {showAllOption && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            disabled={disabled}
            className={`
              p-3 rounded-lg border-2 transition-all text-left
              ${
                !value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Todas las ubicaciones
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Verificar todo el inventario
                </p>
              </div>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        )}

        {ubicaciones.map((ubicacion) => (
          <button
            key={ubicacion.id}
            type="button"
            onClick={() => onChange(ubicacion.id)}
            disabled={disabled}
            className={`
              p-3 rounded-lg border-2 transition-all text-left
              ${
                value === ubicacion.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
              }
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {ubicacion.nombre}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${getTipoColor(
                      ubicacion.tipo
                    )}`}
                  >
                    {getTipoLabel(ubicacion.tipo)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Código: {ubicacion.codigo}
                </p>
                {showCounts && ubicacion.productosCount !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {ubicacion.productosCount} producto
                    {ubicacion.productosCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {ubicaciones.length === 0 && (
        <div className="text-center p-6 text-gray-500 dark:text-gray-400 text-sm">
          No hay ubicaciones disponibles. Cree una ubicación primero.
        </div>
      )}
    </div>
  );
}
