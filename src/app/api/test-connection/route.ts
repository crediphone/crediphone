import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // Verificar que las variables de entorno estén configuradas
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const serviceKeyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;

    console.log("🔍 Diagnóstico de conexión:");
    console.log("- URL configurada:", hasUrl);
    console.log("- Service Key configurada:", hasServiceKey);
    console.log("- Longitud de Service Key:", serviceKeyLength);

    if (!hasUrl || !hasServiceKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Variables de entorno no configuradas",
          details: {
            hasUrl,
            hasServiceKey,
            serviceKeyLength,
          },
        },
        { status: 500 }
      );
    }

    // Intentar conectar y hacer una consulta simple
    const supabase = createAdminClient();

    console.log("🔍 Intentando conectar con Supabase...");
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Consulta simple para verificar la conexión - SIN head: true
    const { data, error, count } = await supabase
      .from("clientes")
      .select("*", { count: "exact" })
      .limit(1);

    console.log("📊 Resultado de la consulta:");
    console.log("- Data:", data);
    console.log("- Data length:", data?.length);
    console.log("- Count:", count);
    console.log("- Error:", error);
    console.log("- Error type:", typeof error);
    console.log("- Error keys:", error ? Object.keys(error) : "no error");

    if (error) {
      console.error("❌ Error completo de Supabase:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: "Error al conectar con Supabase",
          details: {
            code: error.code,
            message: error.message,
            hint: error.hint,
            details: error.details,
            statusCode: (error as any).statusCode,
            fullError: JSON.stringify(error),
          },
          config: {
            hasUrl,
            hasServiceKey,
            serviceKeyLength,
            serviceKeyPreview: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + "...",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conexión exitosa a Supabase",
      config: {
        hasUrl,
        hasServiceKey,
        serviceKeyLength,
        serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20),
      },
      count: data,
    });
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error inesperado",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
