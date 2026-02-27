"use client";

import { MapPin, Package, Barcode } from "lucide-react";
import type { Producto } from "@/types";

interface ProductLocationCardProps {
  producto: Producto;
  ubicacionNombre?: string;
  showLocation?: boolean;
  showBarcode?: boolean;
  onClick?: () => void;
}

export function ProductLocationCard({
  producto,
  ubicacionNombre,
  showLocation = true,
  showBarcode = true,
  onClick,
}: ProductLocationCardProps) {
  return (
    <div
      className={`
        p-4 rounded-lg border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800
        ${onClick ? "cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors" : ""}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Product Image */}
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600"
          />
        ) : (
          <div className="w-16 h-16 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {producto.nombre}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {producto.marca} {producto.modelo}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-500">Stock:</span>{" "}
              <span
                className={`font-medium ${
                  producto.stock > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {producto.stock}
              </span>
            </div>

            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-500">Precio:</span>{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                ${producto.precio.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Location */}
          {showLocation && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {ubicacionNombre || (
                  <span className="text-orange-600 dark:text-orange-400">
                    Sin ubicación
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Barcode/SKU */}
          {showBarcode && (producto.codigoBarras || producto.sku) && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              <Barcode className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 font-mono">
                {producto.codigoBarras || producto.sku}
              </span>
            </div>
          )}

          {/* Last Verification */}
          {producto.ultimaVerificacion && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Última verificación:{" "}
              {new Date(producto.ultimaVerificacion).toLocaleDateString("es-MX")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
