import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { verificarElegibilidad } from "@/lib/db/devoluciones";
import { getConfiguracion } from "@/lib/db/configuracion";

/**
 * GET /api/pos/devoluciones/elegibilidad?ventaId=xxx
 * Verifica si una venta puede ser devuelta según las reglas de negocio.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId, role } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const ventaId = searchParams.get("ventaId");

    if (!ventaId) {
      return NextResponse.json({ success: false, error: "ventaId requerido" }, { status: 400 });
    }

    // Obtener días máximos de configuración
    const config = await getConfiguracion();
    const diasMax = config.diasMaxDevolucion ?? 30;

    const elegibilidad = await verificarElegibilidad(ventaId, diasMax);

    return NextResponse.json({ success: true, data: elegibilidad });
  } catch (error: any) {
    console.error("Error verificando elegibilidad:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
