"use client";

import { useState, useRef } from "react";
import { Button } from "./Button";
import { subirImagen, eliminarImagen, obtenerUrlImagen, type CategoriaImagen } from "@/lib/storage";

interface ImageUploadProps {
  currentImage?: string | null;
  onImageUploaded: (path: string, url: string) => void;
  onImageRemoved?: () => void;
  categoria?: CategoriaImagen;
  label?: string;
}

export function ImageUpload({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  categoria = "otros",
  label = "Imagen del Producto",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    currentImage ? obtenerUrlImagen(currentImage) : null
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!tiposPermitidos.includes(file.type)) {
      setError("Solo se permiten imágenes JPEG, PNG, WebP y GIF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen debe ser menor a 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const result = await subirImagen(file, categoria);

      if (result) {
        onImageUploaded(result.path, result.url);
      } else {
        setError("Error al subir la imagen");
        setPreview(null);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error al procesar la imagen");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentImage) return;

    setUploading(true);
    try {
      const success = await eliminarImagen(currentImage);
      if (success) {
        setPreview(null);
        if (onImageRemoved) {
          onImageRemoved();
        }
      } else {
        setError("Error al eliminar la imagen");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Error al eliminar la imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </label>

      {preview ? (
        <div className="relative group">
          <div
            className="relative w-full h-64 rounded-lg overflow-hidden"
            style={{
              background: "var(--color-bg-elevated)",
              border: "2px solid var(--color-border)",
            }}
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-b-2"
                  style={{ borderColor: "var(--color-accent)" }}
                />
              </div>
            )}
          </div>

          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              📸 Cambiar Imagen
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleRemove}
              disabled={uploading}
              className="flex-1"
            >
              🗑️ Eliminar
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="relative w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors"
          style={{
            borderColor: uploading ? "var(--color-border)" : "var(--color-border-strong)",
            background: uploading ? "var(--color-bg-elevated)" : "var(--color-bg-sunken)",
            cursor: uploading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)";
              (e.currentTarget as HTMLElement).style.background = "var(--color-accent-light)";
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-strong)";
              (e.currentTarget as HTMLElement).style.background = "var(--color-bg-sunken)";
            }
          }}
        >
          {uploading ? (
            <>
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: "var(--color-accent)" }}
              />
              <p className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Subiendo imagen...
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">📷</div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                Haz clic para subir una imagen
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
                JPEG, PNG, WebP o GIF (máx. 5MB)
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && (
        <div
          className="text-sm rounded-md p-3"
          style={{
            color: "var(--color-danger-text)",
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-danger)",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div
        className="text-xs rounded-md p-2"
        style={{
          color: "var(--color-info-text)",
          background: "var(--color-info-bg)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        💡 <strong>Tip:</strong> Usa imágenes cuadradas (1:1) para mejor visualización en el catálogo
      </div>
    </div>
  );
}
