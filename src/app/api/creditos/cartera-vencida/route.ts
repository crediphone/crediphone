import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { getCarteraVencida } from "@/lib/db/creditos";

/**
 * GET /api/creditos/cartera-vencida
 * Retorna el reporte de cartera vencida (créditos con mora > 0)
 * Acceso: admin, cobrador, super_admin
 */
export async function GET() {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!role || !["admin", "cobrador", "super_admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      );
    }

    const creditos = await getCarteraVencida(
      role === "super_admin" ? undefined : distribuidorId ?? undefined
    );

    // Calcular resumen
    const totalSaldoPendiente = creditos.reduce((s, c) => s + c.saldoPendiente, 0);
    const totalMoraAcumulada = creditos.reduce((s, c) => s + c.montoMora, 0);
    const promedioDiasMora =
      creditos.length > 0
        ? creditos.reduce((s, c) => s + c.diasMora, 0) / creditos.length
        : 0;

    const distribucionRiesgo = {
      bajo: creditos.filter((c) => c.nivelRiesgo === "bajo").length,
      medio: creditos.filter((c) => c.nivelRiesgo === "medio").length,
      alto: creditos.filter((c) => c.nivelRiesgo === "alto").length,
      critico: creditos.filter((c) => c.nivelRiesgo === "critico").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        creditos,
        resumen: {
          total: creditos.length,
          totalSaldoPendiente,
          totalMoraAcumulada,
          promedioDiasMora: Math.round(promedioDiasMora),
          distribucionRiesgo,
        },
      },
    });
  } catch (error) {
    console.error("Error en GET /api/creditos/cartera-vencida:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener cartera vencida",
      },
      { status: 500 }
    );
  }
}
