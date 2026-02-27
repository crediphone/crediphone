import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente de Supabase para el navegador
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = "productos";

/**
 * Genera un nombre de archivo único con timestamp
 */
function generarNombreArchivo(nombreOriginal: string, categoria: string = "otros"): string {
  const timestamp = Date.now();
  const extension = nombreOriginal.split(".").pop();
  const nombreLimpio = nombreOriginal
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/\.[^/.]+$/, ""); // Quitar extensión

  return `${categoria}/${nombreLimpio}-${timestamp}.${extension}`;
}

/**
 * Sube una imagen al storage de Supabase
 */
export async function subirImagen(
  archivo: File,
  categoria: string = "otros"
): Promise<{ url: string; path: string } | null> {
  try {
    // Validar tipo de archivo
    const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!tiposPermitidos.includes(archivo.type)) {
      throw new Error("Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG, WebP y GIF.");
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (archivo.size > maxSize) {
      throw new Error("El archivo es demasiado grande. Máximo 5MB.");
    }

    // Generar nombre único
    const nombreArchivo = generarNombreArchivo(archivo.name, categoria);

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(nombreArchivo, archivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error al subir imagen:", error);
      throw error;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(nombreArchivo);

    return {
      url: urlData.publicUrl,
      path: nombreArchivo,
    };
  } catch (error) {
    console.error("Error en subirImagen:", error);
    return null;
  }
}

/**
 * Elimina una imagen del storage
 */
export async function eliminarImagen(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error("Error al eliminar imagen:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error en eliminarImagen:", error);
    return false;
  }
}

/**
 * Obtiene la URL pública de una imagen
 */
export function obtenerUrlImagen(path: string | null | undefined): string | null {
  if (!path) return null;

  // Si ya es una URL completa, devolverla tal cual
  if (path.startsWith("http")) return path;

  // Generar URL pública
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Lista todas las imágenes de una categoría
 */
export async function listarImagenes(categoria?: string): Promise<string[]> {
  try {
    const path = categoria || "";

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("Error al listar imágenes:", error);
      return [];
    }

    return data.map((file) => `${path}${path ? "/" : ""}${file.name}`);
  } catch (error) {
    console.error("Error en listarImagenes:", error);
    return [];
  }
}

/**
 * Actualiza la imagen de un producto (elimina la anterior y sube la nueva)
 */
export async function actualizarImagenProducto(
  imagenAnterior: string | null,
  nuevaImagen: File,
  categoria: string = "otros"
): Promise<{ url: string; path: string } | null> {
  try {
    // Eliminar imagen anterior si existe
    if (imagenAnterior) {
      await eliminarImagen(imagenAnterior);
    }

    // Subir nueva imagen
    return await subirImagen(nuevaImagen, categoria);
  } catch (error) {
    console.error("Error en actualizarImagenProducto:", error);
    return null;
  }
}

/**
 * Categorías disponibles para organizar imágenes
 */
export const CATEGORIAS_IMAGENES = {
  PRODUCTOS: "productos",
  CELULARES: "celulares",
  ACCESORIOS: "accesorios",
  LAPTOPS: "laptops",
  TABLETS: "tablets",
  SMARTWATCHES: "smartwatches",
  AUDIFONOS: "audifonos",
  OTROS: "otros",
} as const;

export type CategoriaImagen = (typeof CATEGORIAS_IMAGENES)[keyof typeof CATEGORIAS_IMAGENES];
