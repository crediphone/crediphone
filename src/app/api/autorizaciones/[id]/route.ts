import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { getSolicitudById } from "@/lib/db/autorizaciones";

/**
 * GET /api/autorizaciones/[id]
 * Polling endpoint: el POS consulta periódicamente el estado de la solicitud.
 * Retorna el estado actual (pendiente / aprobado / declinado / expirado).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const solicitud = await getSolicitudById(id);

    if (!solicitud) {
      return NextResponse.json(
        { success: false, error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: solicitud.id,
        estado: solicitud.estado,
        autorizadorNombre: solicitud.autorizadorNombre,
        comentarioAutorizador: solicitud.comentarioAutorizador,
        respondidoAt: solicitud.respondidoAt,
        expiresAt: solicitud.expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
