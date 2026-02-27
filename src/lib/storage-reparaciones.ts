import { createClient } from "@supabase/supabase-js";
import imageCompression from "browser-image-compression";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = "reparaciones";

/**
 * Genera un nombre de archivo único con timestamp
 */
function generarNombreArchivo(
  ordenId: string,
  tipoImagen: string,
  extension: string = "jpg"
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${ordenId}/${tipoImagen}/${timestamp}-${random}.${extension}`;
}

/**
 * Comprime una imagen antes de subirla
 */
export async function comprimirImagen(archivo: File): Promise<File> {
  const opciones = {
    maxSizeMB: 1, // Máximo 1MB
    maxWidthOrHeight: 1920, // Máximo 1920px
    useWebWorker: true,
    fileType: "image/jpeg",
  };

  try {
    const archivoComprimido = await imageCompression(archivo, opciones);
    return archivoComprimido;
  } catch (error) {
    console.error("Error al comprimir imagen:", error);
    return archivo; // Si falla, usar original
  }
}

/**
 * Sube una imagen al storage de reparaciones
 */
export async function subirImagenReparacion(
  archivo: File,
  ordenId: string,
  tipoImagen:
    | "dispositivo"
    | "dano"
    | "accesorio"
    | "diagnostico"
    | "finalizado"
): Promise<{ url: string; path: string } | null> {
  try {
    // Validar tipo de archivo
    const tiposPermitidos = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!tiposPermitidos.includes(archivo.type)) {
      throw new Error(
        "Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG y WebP."
      );
    }

    // Validar tamaño (10MB máximo - igual que el bucket)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (archivo.size > maxSize) {
      throw new Error("El archivo es demasiado grande. Máximo 10MB.");
    }

    // Comprimir imagen si es mayor a 2MB
    let archivoFinal = archivo;
    if (archivo.size > 2 * 1024 * 1024) {
      console.log("Comprimiendo imagen...");
      archivoFinal = await comprimirImagen(archivo);
      console.log(
        `Imagen comprimida: ${archivo.size} bytes → ${archivoFinal.size} bytes`
      );
    }

    // Generar nombre único
    const extension = archivoFinal.name.split(".").pop() || "jpg";
    const nombreArchivo = generarNombreArchivo(ordenId, tipoImagen, extension);

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(nombreArchivo, archivoFinal, {
        cacheControl: "3600",
        upsert: false,
        contentType: archivoFinal.type,
      });

    if (error) {
      console.error("Error al subir imagen:", error);
      throw error;
    }

    // Obtener URL pública (aunque el bucket sea privado, esta URL se puede firmar)
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(nombreArchivo);

    return {
      url: urlData.publicUrl,
      path: nombreArchivo,
    };
  } catch (error) {
    console.error("Error en subirImagenReparacion:", error);
    return null;
  }
}

/**
 * Sube múltiples imágenes de forma paralela
 */
export async function subirMultiplesImagenes(
  archivos: File[],
  ordenId: string,
  tipoImagen:
    | "dispositivo"
    | "dano"
    | "accesorio"
    | "diagnostico"
    | "finalizado"
): Promise<Array<{ url: string; path: string } | null>> {
  const promesas = archivos.map((archivo) =>
    subirImagenReparacion(archivo, ordenId, tipoImagen)
  );

  return await Promise.all(promesas);
}

/**
 * Elimina una imagen del storage
 */
export async function eliminarImagenReparacion(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      console.error("Error al eliminar imagen:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error en eliminarImagenReparacion:", error);
    return false;
  }
}

/**
 * Obtiene la URL firmada (privada) de una imagen
 * Válida por 1 hora por defecto
 */
export async function obtenerUrlFirmadaImagen(
  path: string,
  duracionSegundos: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, duracionSegundos);

    if (error) {
      console.error("Error al obtener URL firmada:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error en obtenerUrlFirmadaImagen:", error);
    return null;
  }
}

/**
 * Lista todas las imágenes de una orden
 */
export async function listarImagenesOrden(
  ordenId: string
): Promise<
  Array<{ name: string; path: string; created_at: string; size: number }>
> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(ordenId, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("Error al listar imágenes:", error);
      return [];
    }

    return data.map((file) => ({
      name: file.name,
      path: `${ordenId}/${file.name}`,
      created_at: file.created_at || "",
      size: file.metadata?.size || 0,
    }));
  } catch (error) {
    console.error("Error en listarImagenesOrden:", error);
    return [];
  }
}

/**
 * Genera un token único de 64 caracteres para sesiones QR
 */
export function generarTokenQR(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Valida que una URL de imagen sea del bucket de reparaciones
 */
export function esImagenReparacionValida(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes("supabase.co") &&
      urlObj.pathname.includes("/reparaciones/")
    );
  } catch {
    return false;
  }
}
