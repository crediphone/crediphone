import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { getPagosByCredito } from "@/lib/db/pagos";
import { calcularTotalPagado, calcularSaldoPendiente } from "@/lib/db/creditos";

/**
 * GET /api/creditos/[id]/pagos
 * Retorna el historial de pagos de un crédito + totales
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const { id: creditoId } = await params;

    const [pagos, totalPagado, saldoPendiente] = await Promise.all([
      getPagosByCredito(creditoId),
      calcularTotalPagado(creditoId),
      calcularSaldoPendiente(creditoId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pagos,
        totalPagado,
        saldoPendiente,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/creditos/[id]/pagos:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener pagos",
      },
      { status: 500 }
    );
  }
}
