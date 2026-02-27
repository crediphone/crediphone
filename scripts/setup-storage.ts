/**
 * Script para configurar Storage de Supabase
 * Ejecutar con: npx tsx scripts/setup-storage.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Faltan variables de entorno");
  console.error("Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStorage() {
  console.log("🚀 Configurando Storage de Supabase...\n");

  try {
    // 1. Verificar si el bucket ya existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Error al listar buckets:", listError);
      return;
    }

    const bucketExists = buckets?.some((b) => b.name === "productos");

    if (bucketExists) {
      console.log("ℹ️  El bucket 'productos' ya existe");
      console.log("✅ No es necesario crearlo de nuevo\n");
      return;
    }

    // 2. Crear el bucket
    console.log("📦 Creando bucket 'productos'...");
    const { data: bucket, error: createError } = await supabase.storage.createBucket(
      "productos",
      {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
        ],
      }
    );

    if (createError) {
      console.error("❌ Error al crear bucket:", createError);
      return;
    }

    console.log("✅ Bucket 'productos' creado exitosamente\n");

    // 3. Mostrar información
    console.log("📋 Configuración del bucket:");
    console.log("   - Nombre: productos");
    console.log("   - Público: Sí");
    console.log("   - Límite de tamaño: 5MB");
    console.log("   - Formatos: JPEG, PNG, WebP, GIF\n");

    console.log("🎉 Storage configurado correctamente!");
    console.log("\n📁 Estructura recomendada:");
    console.log("   /productos/nombre-producto-timestamp.jpg");
    console.log("   /celulares/iphone-14-timestamp.jpg");
    console.log("   /accesorios/airpods-timestamp.jpg");
    console.log("\n✨ Ahora puedes subir imágenes desde la aplicación");

  } catch (error) {
    console.error("❌ Error inesperado:", error);
  }
}

setupStorage();
