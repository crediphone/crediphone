/**
 * Script para arreglar políticas de Storage
 * Las políticas RLS del bucket están bloqueando las subidas
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixStoragePolicies() {
  console.log("🔧 Arreglando políticas de Storage...\n");

  try {
    // Opción 1: Actualizar bucket para ser completamente público (más fácil para desarrollo)
    console.log("📦 Actualizando configuración del bucket...");

    const { data: bucket, error: updateError } = await supabase.storage.updateBucket(
      "productos",
      {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
        ],
      }
    );

    if (updateError) {
      console.error("❌ Error al actualizar bucket:", updateError);
      console.log("\n💡 Solución alternativa:");
      console.log("   Ve a Supabase Dashboard → Storage → productos → Configuration");
      console.log("   Y desmarca 'Restrict access based on RLS policies'");
      return;
    }

    console.log("✅ Bucket actualizado correctamente\n");

    // Verificar que el bucket existe y está configurado
    const { data: buckets } = await supabase.storage.listBuckets();
    const productosBucket = buckets?.find((b) => b.name === "productos");

    if (productosBucket) {
      console.log("📋 Estado actual del bucket:");
      console.log("   - Público:", productosBucket.public ? "✅ Sí" : "❌ No");
      console.log("   - Límite de tamaño:", productosBucket.file_size_limit, "bytes (5MB)");
      console.log("");
    }

    console.log("🎉 ¡Listo! Ahora deberías poder subir imágenes");
    console.log("\n💡 Tip: Si aún tienes problemas:");
    console.log("   1. Recarga la página de tu aplicación (Ctrl+F5)");
    console.log("   2. Verifica que estás logueado en Supabase");
    console.log("   3. Revisa la consola del navegador para más detalles");

  } catch (error) {
    console.error("❌ Error inesperado:", error);
    console.log("\n📖 Solución manual:");
    console.log("   1. Ve a: https://supabase.com/dashboard");
    console.log("   2. Selecciona tu proyecto");
    console.log("   3. Storage → Buckets → productos");
    console.log("   4. Configuration → Desmarca 'Restrict access with RLS'");
    console.log("   5. Save");
  }
}

fixStoragePolicies();
