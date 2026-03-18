import { NextResponse } from "next/server";
import {
  getNotificacionesUsuario,
  contarNotificacionesNoLeidas,
  marcarTodasComoLeidas,
} from "@/lib/notificaciones-reparaciones";
import { marcarNotificacionComoLeida } from "@/lib/db/notificaciones";
import { requireAuth } from "@/lib/auth/guard";

/**
 * GET /api/notificaciones
 * Obtiene notificaciones del usuario actual
 * Query params: ?usuario_id=xxx&no_leidas=true&limite=20
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    // super_admin puede consultar cualquier usuario_id; el resto solo el suyo
    const usuarioId = auth.isSuperAdmin
      ? (searchParams.get("usuario_id") || auth.userId)
      : auth.userId;
    const soloNoLeidas = searchParams.get("no_leidas") === "true";
    const limite = parseInt(searchParams.get("limite") || "20", 10);
    const soloConteo = searchParams.get("conteo") === "true";

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: "usuario_id es requerido" },
        { status: 400 }
      );
    }

    // Si solo necesitan el conteo
    if (soloConteo) {
      const count = await contarNotificacionesNoLeidas(usuarioId);
      return NextResponse.json({ success: true, count });
    }

    const notificaciones = await getNotificacionesUsuario(
      usuarioId,
      soloNoLeidas,
      limite
    );

    const countNoLeidas = await contarNotificacionesNoLeidas(usuarioId);

    return NextResponse.json({
      success: true,
      data: notificaciones,
      countNoLeidas,
    });
  } catch (error) {
    console.error("Error en GET /api/notificaciones:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener notificaciones",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notificaciones
 * Marca notificaciones como leídas
 * Body: { id: string } o { marcarTodas: true, usuario_id: string }
 */
export async function PUT(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const body = await request.json();

    if (body.marcarTodas && body.usuario_id) {
      await marcarTodasComoLeidas(body.usuario_id);
      return NextResponse.json({
        success: true,
        message: "Todas las notificaciones marcadas como leídas",
      });
    }

    if (body.id) {
      await marcarNotificacionComoLeida(body.id);
      return NextResponse.json({
        success: true,
        message: "Notificación marcada como leída",
      });
    }

    return NextResponse.json(
      { success: false, error: "Debe enviar 'id' o 'marcarTodas' con 'usuario_id'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en PUT /api/notificaciones:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar notificaciones",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
