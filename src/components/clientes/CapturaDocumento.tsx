"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { subirImagen, eliminarImagen, obtenerUrlImagen } from "@/lib/storage";
import { comprimirImagen, esImagen, validarTamañoMaximo } from "@/lib/imageCompression";

interface CapturaDocumentoProps {
  label: string;
  tipoDocumento: string; // 'ine_frontal', 'ine_reverso', 'comprobante', etc.
  imagenActual?: string | null;
  onImagenCargada: (path: string, url: string) => void;
  onImagenEliminada?: () => void;
  descripcion?: string;
}

export function CapturaDocumento({
  label,
  tipoDocumento,
  imagenActual,
  onImagenCargada,
  onImagenEliminada,
  descripcion,
}: CapturaDocumentoProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    imagenActual ? obtenerUrlImagen(imagenActual) : null
  );
  const [progreso, setProgreso] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setError(null);
    setProgreso("");

    // Validar que sea imagen
    if (!esImagen(archivo)) {
      setError("Por favor selecciona una imagen válida (JPG, PNG, WebP)");
      return;
    }

    // Validar tamaño máximo (10MB antes de comprimir)
    if (!validarTamañoMaximo(archivo, 10)) {
      setError("La imagen es demasiado grande. Máximo 10MB.");
      return;
    }

    try {
      setCargando(true);
      setProgreso("📸 Comprimiendo imagen...");

      // Comprimir imagen automáticamente
      const archivoComprimido = await comprimirImagen(archivo, {
        maxSizeMB: 0.5, // Máximo 500KB
        maxWidthOrHeight: 1920,
      });

      setProgreso("☁️ Subiendo al servidor...");

      // Subir imagen comprimida
      const resultado = await subirImagen(archivoComprimido, `documentos/${tipoDocumento}`);

      if (!resultado) {
        throw new Error("No se pudo subir la imagen");
      }

      // Actualizar preview
      setPreview(resultado.url);
      setProgreso("✅ ¡Listo!");

      // Notificar al padre
      onImagenCargada(resultado.path, resultado.url);

      // Limpiar progreso después de 2 segundos
      setTimeout(() => setProgreso(""), 2000);
    } catch (err) {
      console.error("Error al procesar imagen:", err);
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async () => {
    if (!imagenActual) return;

    if (!confirm("¿Eliminar esta imagen?")) return;

    try {
      setCargando(true);
      await eliminarImagen(imagenActual);
      setPreview(null);
      if (onImagenEliminada) onImagenEliminada();
    } catch (err) {
      console.error("Error al eliminar imagen:", err);
      setError("No se pudo eliminar la imagen");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {descripcion && (
          <span className="block text-xs text-gray-500 font-normal mt-1">
            {descripcion}
          </span>
        )}
      </label>

      {/* Vista previa */}
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt={label}
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={cargando}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-medium shadow-lg"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={handleEliminar}
              disabled={cargando}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-medium shadow-lg"
            >
              Eliminar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={cargando}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer"
        >
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm text-gray-600 font-medium">
            {cargando ? "Procesando..." : "Tomar foto o seleccionar archivo"}
          </span>
          <span className="text-xs text-gray-400">
            Se comprimirá automáticamente
          </span>
        </button>
      )}

      {/* Input file oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={cargando}
      />

      {/* Progreso */}
      {progreso && (
        <div className="text-sm text-blue-600 font-medium text-center bg-blue-50 p-2 rounded">
          {progreso}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
