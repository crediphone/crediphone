import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import {
  getTiempoLogs,
  iniciarSesion,
  finalizarSesion,
  cancelarSesionActiva,
} from "@/lib/db/tiempo-reparaciones";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const resumen = await getTiempoLogs(id);
    return NextResponse.json({ success: true, data: resumen });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener tiempos" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: ordenId } = await params;
    const body = await request.json();
    const { action, notas } = body;

    if (action === "iniciar") {
      const log = await iniciarSesion(ordenId, userId, distribuidorId ?? null, notas);
      return NextResponse.json({ success: true, data: log });
    }

    if (action === "finalizar") {
      const log = await finalizarSesion(ordenId, userId, notas);
      return NextResponse.json({ success: true, data: log });
    }

    if (action === "cancelar") {
      // Solo admin/super_admin puede cancelar sesiones ajenas
      const tecnicoId = body.tecnicoId ?? userId;
      if (
        tecnicoId !== userId &&
        role !== "admin" &&
        role !== "super_admin"
      ) {
        return NextResponse.json(
          { success: false, error: "Solo administradores pueden cancelar sesiones ajenas" },
          { status: 403 }
        );
      }
      await cancelarSesionActiva(ordenId, tecnicoId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida. Use: iniciar | finalizar | cancelar" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error en operación de tiempo" },
      { status: 500 }
    );
  }
}
