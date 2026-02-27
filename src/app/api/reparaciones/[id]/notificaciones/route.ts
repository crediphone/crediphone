import { NextResponse } from "next/server";
import { getNotificacionesOrden } from "@/lib/notificaciones-reparaciones";

/**
 * GET /api/reparaciones/[id]/notificaciones
 * Obtiene historial de notificaciones de una orden
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const notificaciones = await getNotificacionesOrden(id);

    return NextResponse.json({
      success: true,
      data: notificaciones,
      total: notificaciones.length,
    });
  } catch (error) {
    console.error("Error en GET /api/reparaciones/[id]/notificaciones:", error);
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
 * POST /api/reparaciones/[id]/notificaciones
 * Registra envío manual de notificación
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido" },
        { status: 400 }
      );
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("notificaciones")
      .insert({
        orden_reparacion_id: id,
        cliente_id: body.clienteId || null,
        tipo: body.tipo || "orden_actualizada",
        canal: body.canal || "whatsapp",
        estado: "enviado",
        mensaje: body.mensaje,
        telefono: body.telefono || null,
        fecha_enviado: new Date().toISOString(),
        datos_adicionales: {
          origen: "envio_manual",
          fecha_accion: new Date().toISOString(),
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error al registrar notificación:", error);
      return NextResponse.json(
        { success: false, error: "Error al registrar notificación" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: data.id },
      message: "Notificación registrada",
    });
  } catch (error) {
    console.error("Error en POST /api/reparaciones/[id]/notificaciones:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al registrar notificación",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
