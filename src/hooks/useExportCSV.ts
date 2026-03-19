/**
 * useExportCSV
 *
 * Hook para exportar datos a CSV directamente en el navegador (sin backend).
 * Genera el archivo en memoria, crea un Blob y lo descarga automáticamente.
 *
 * Uso:
 *   const { exportar, exportando } = useExportCSV();
 *   exportar({ datos, columnas, nombreArchivo: "creditos-2026-03.csv" });
 */

import { useState, useCallback } from "react";

export interface ColumnaExport<T = Record<string, unknown>> {
  /** Encabezado que aparecerá en la primera fila del CSV */
  header: string;
  /** Accessor: clave del objeto o función que devuelve el valor */
  accessor: keyof T | ((row: T) => string | number | null | undefined);
}

export interface ExportarOptions<T = Record<string, unknown>> {
  datos: T[];
  columnas: ColumnaExport<T>[];
  nombreArchivo?: string;
  /** Separador de columnas. Default: "," */
  separador?: string;
}

function escaparValorCSV(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  const str = String(valor);
  // Si contiene coma, comilla o salto de línea → envolver en comillas y escapar comillas internas
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes(";")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generarCSV<T>(
  datos: T[],
  columnas: ColumnaExport<T>[],
  separador: string
): string {
  const encabezados = columnas.map((c) => escaparValorCSV(c.header)).join(separador);

  const filas = datos.map((fila) =>
    columnas
      .map((col) => {
        let valor: string | number | null | undefined;
        if (typeof col.accessor === "function") {
          valor = col.accessor(fila);
        } else {
          valor = (fila as Record<string, unknown>)[col.accessor as string] as
            | string
            | number
            | null
            | undefined;
        }
        return escaparValorCSV(valor);
      })
      .join(separador)
  );

  return [encabezados, ...filas].join("\n");
}

export function useExportCSV() {
  const [exportando, setExportando] = useState(false);

  const exportar = useCallback(
    <T>({
      datos,
      columnas,
      nombreArchivo = "export.csv",
      separador = ",",
    }: ExportarOptions<T>) => {
      if (exportando || datos.length === 0) return;

      setExportando(true);
      try {
        // BOM UTF-8 para que Excel lo abra correctamente con caracteres especiales
        const bom = "\uFEFF";
        const contenidoCSV = bom + generarCSV(datos, columnas, separador);
        const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", nombreArchivo);
        document.body.appendChild(link);
        link.click();

        // Limpiar
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } finally {
        setExportando(false);
      }
    },
    [exportando]
  );

  return { exportar, exportando };
}
