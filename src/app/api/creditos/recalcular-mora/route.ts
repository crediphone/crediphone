import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { recalcularTodasLasMoras } from "@/lib/db/creditos";

/**
 * POST /api/creditos/recalcular-mora
 * Recalcula dias_mora y monto_mora para todos los créditos activos/vencidos.
 * Acceso: admin, cobrador, super_admin
 */
export async function POST() {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!role || !["admin", "cobrador", "super_admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "No autorizado para recalcular mora" },
        { status: 403 }
      );
    }

    const resultado = await recalcularTodasLasMoras(
      role === "super_admin" ? undefined : distribuidorId ?? undefined
    );

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Mora recalculada: ${resultado.enMora} créditos con mora, ${resultado.actualizados} actualizados`,
    });
  } catch (error) {
    console.error("Error en POST /api/creditos/recalcular-mora:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al recalcular mora",
      },
      { status: 500 }
    );
  }
}
