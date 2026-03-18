import { NextResponse } from "next/server";
import { getHistorialEstadosOrden } from "@/lib/db/reparaciones";
import { requireAuth } from "@/lib/auth/guard";

/**
 * GET /api/reparaciones/[id]/historial
 * Obtiene el historial de cambios de estado de una orden
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["admin", "tecnico", "super_admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
          message: "El ID proporcionado no es un UUID válido",
        },
        { status: 400 }
      );
    }

    const historial = await getHistorialEstadosOrden(id);

    return NextResponse.json({
      success: true,
      data: historial,
    });
  } catch (error) {
    console.error("Error en GET /api/reparaciones/[id]/historial:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener historial de estados",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
