import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { declinarSolicitud, getSolicitudById } from "@/lib/db/autorizaciones";

/**
 * POST /api/autorizaciones/[id]/declinar
 * El admin/super_admin declina una solicitud de descuento.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await getSolicitudById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Solicitud no encontrada" }, { status: 404 });
    }
    if (
      role !== "super_admin" &&
      existing.distribuidorId !== distribuidorId
    ) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const comentario = typeof body.comentario === "string" ? body.comentario : "";
    const autorizadorNombre = typeof body.autorizadorNombre === "string"
      ? body.autorizadorNombre
      : "Administrador";

    if (!comentario.trim()) {
      return NextResponse.json(
        { success: false, error: "Se requiere un comentario para declinar" },
        { status: 400 }
      );
    }

    const solicitud = await declinarSolicitud(id, userId, autorizadorNombre, comentario);

    return NextResponse.json({ success: true, data: solicitud });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
