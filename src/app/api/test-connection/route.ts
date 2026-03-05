import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthContext } from "@/lib/auth/server";

/**
 * GET /api/test-connection
 * Diagnóstico de conexión a Supabase.
 * RESTRINGIDO: solo super_admin, solo en development.
 */
export async function GET() {
  // Solo disponible en desarrollo
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Endpoint no disponible en producción" },
      { status: 404 }
    );
  }

  try {
    const { userId, role } = await getAuthContext();

    if (!userId || role !== "super_admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!hasUrl || !hasServiceKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Variables de entorno no configuradas",
          details: { hasUrl, hasServiceKey },
        },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();

    const { error, count } = await supabase
      .from("clientes")
      .select("*", { count: "exact" })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Error al conectar con Supabase",
          details: { code: error.code, message: error.message },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conexión exitosa a Supabase",
      clientesCount: count,
    });
  } catch (error) {
    console.error("Error en /api/test-connection:", error);
    return NextResponse.json(
      { success: false, error: "Error inesperado" },
      { status: 500 }
    );
  }
}
