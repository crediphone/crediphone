import { NextResponse } from "next/server";
import { getEstadisticasPOS } from "@/lib/db/ventas";
import { getAuthContext } from "@/lib/auth/server";

const ALLOWED_ROLES = ["admin", "vendedor", "cobrador", "super_admin"];

/**
 * GET /api/pos/stats
 * Devuelve estadísticas de ventas POS (productos más vendidos, totales del período).
 * Usado por /dashboard/inventario/alertas para cruzar stock con demanda real.
 */
export async function GET() {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const distId = isSuperAdmin ? undefined : (distribuidorId ?? undefined);

    const stats = await getEstadisticasPOS(distId);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error en GET /api/pos/stats:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener estadísticas POS" },
      { status: 500 }
    );
  }
}
