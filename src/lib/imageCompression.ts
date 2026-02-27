import imageCompression from "browser-image-compression";

/**
 * Comprime una imagen automáticamente (estilo WhatsApp)
 * Reduce tamaño y calidad para evitar saturación de storage
 */
export async function comprimirImagen(
  archivo: File,
  opciones?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
  }
): Promise<File> {
  const opcionesPorDefecto = {
    maxSizeMB: 0.5, // Máximo 500KB (similar a WhatsApp)
    maxWidthOrHeight: 1920, // Máximo 1920px de ancho/alto
    useWebWorker: true, // Usar Web Worker para no bloquear UI
    fileType: "image/jpeg", // Convertir todo a JPEG
    initialQuality: 0.8, // Calidad inicial 80%
  };

  const opcionesFinales = { ...opcionesPorDefecto, ...opciones };

  try {
    console.log(`📸 Comprimiendo imagen: ${archivo.name}`);
    console.log(`   Tamaño original: ${(archivo.size / 1024 / 1024).toFixed(2)} MB`);

    const archivoComprimido = await imageCompression(archivo, opcionesFinales);

    console.log(`   Tamaño comprimido: ${(archivoComprimido.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Reducción: ${(((archivo.size - archivoComprimido.size) / archivo.size) * 100).toFixed(1)}%`);

    return archivoComprimido;
  } catch (error) {
    console.error("Error al comprimir imagen:", error);
    throw new Error("No se pudo comprimir la imagen");
  }
}

/**
 * Comprime múltiples imágenes en paralelo
 */
export async function comprimirImagenes(archivos: File[]): Promise<File[]> {
  const promesas = archivos.map((archivo) => comprimirImagen(archivo));
  return Promise.all(promesas);
}

/**
 * Valida que un archivo sea una imagen
 */
export function esImagen(archivo: File): boolean {
  const tiposPermitidos = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
  return tiposPermitidos.includes(archivo.type);
}

/**
 * Valida tamaño máximo antes de comprimir
 */
export function validarTamañoMaximo(archivo: File, maxMB: number = 10): boolean {
  const maxBytes = maxMB * 1024 * 1024;
  return archivo.size <= maxBytes;
}

/**
 * Obtiene dimensiones de una imagen
 */
export async function obtenerDimensiones(archivo: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(archivo);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };

    img.src = url;
  });
}
