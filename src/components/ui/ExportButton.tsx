"use client";

/**
 * ExportButton
 *
 * Botón reutilizable para exportar datos a CSV.
 * Usa useExportCSV internamente.
 *
 * Props:
 *   datos        → array de objetos a exportar
 *   columnas     → definición de columnas { header, accessor }
 *   nombreArchivo → nombre del archivo descargado (sin extensión .csv)
 *   label        → texto del botón (default: "Exportar CSV")
 *   disabled     → deshabilitar si no hay datos
 *   className    → clases adicionales
 */

import { Download } from "lucide-react";
import { useExportCSV, ColumnaExport } from "@/hooks/useExportCSV";

interface ExportButtonProps<T = Record<string, unknown>> {
  datos: T[];
  columnas: ColumnaExport<T>[];
  nombreArchivo?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ExportButton<T = Record<string, unknown>>({
  datos,
  columnas,
  nombreArchivo = "export",
  label = "Exportar CSV",
  disabled = false,
  className = "",
}: ExportButtonProps<T>) {
  const { exportar, exportando } = useExportCSV();

  const handleClick = () => {
    const fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    exportar({
      datos,
      columnas,
      nombreArchivo: `${nombreArchivo}-${fecha}.csv`,
    });
  };

  const isDisabled = disabled || exportando || datos.length === 0;

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      title={datos.length === 0 ? "No hay datos para exportar" : `Exportar ${datos.length} filas a CSV`}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        fontSize: "13px",
        fontWeight: 500,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: isDisabled
          ? "var(--color-bg-elevated)"
          : "var(--color-bg-surface)",
        color: isDisabled
          ? "var(--color-text-muted)"
          : "var(--color-text-secondary)",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 150ms ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--color-accent)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--color-accent)";
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--color-accent-light)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--color-border)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--color-text-secondary)";
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--color-bg-surface)";
        }
      }}
    >
      <Download
        style={{
          width: 14,
          height: 14,
          animation: exportando ? "spin 1s linear infinite" : "none",
        }}
      />
      {exportando ? "Exportando..." : label}
    </button>
  );
}
