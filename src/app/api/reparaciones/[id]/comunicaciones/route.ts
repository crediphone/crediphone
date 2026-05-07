import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/reparaciones/[id]/comunicaciones
 *
 * Devuelve el historial de mensajes WhatsApp enviados para esta orden.
 * Visible para admin, técnico y vendedor (todos los roles autenticados).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const { id: ordenId } = await params;
    const supabase = createAdminClient();

    // Verificar que la orden pertenece al distribuidor (salvo super_admin)
    if (!isSuperAdmin && distribuidorId) {
      const { data: orden } = await supabase
        .from("ordenes_reparacion")
        .select("id, distribuidor_id")
        .eq("id", ordenId)
        .single();

      if (!orden || orden.distribuidor_id !== distribuidorId) {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
      }
    }

    // Consultar mensajes WA de la orden (más recientes primero)
    const { data: mensajes, error } = await supabase
      .from("whatsapp_mensajes")
      .select("id, canal, estado, mensaje, error_detalle, created_at")
      .eq("entidad_tipo", "reparacion")
      .eq("entidad_id", ordenId)
      .eq("tipo", "outbound")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[comunicaciones] Error al consultar:", error.message);
      return NextResponse.json({ success: false, error: "Error al obtener comunicaciones" }, { status: 500 });
    }

    // También revisar notificaciones_fallidas para esta orden
    const { data: fallidas } = await supabase
      .from("notificaciones_fallidas")
      .select("id, tipo, canal, error, created_at")
      .eq("orden_id", ordenId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Unificar: mensajes enviados + fallidos (los fallidos pueden ya estar en whatsapp_mensajes con estado="fallido")
    // Evitar duplicar: solo agregar fallidas que NO aparezcan en mensajes con estado="fallido"
    const mensajesIds = new Set((mensajes ?? []).map((m) => m.id));

    const data = [
      ...(mensajes ?? []).map((m) => ({
        id: m.id,
        tipo: "wa",
        canal: m.canal as string,
        estado: m.estado as string,
        resumen: m.mensaje ? m.mensaje.slice(0, 80).replace(/\n/g, " ") + (m.mensaje.length > 80 ? "…" : "") : "—",
        error: m.error_detalle ?? null,
        creadoEn: m.created_at,
      })),
      ...(fallidas ?? [])
        .filter((f) => !mensajesIds.has(f.id))
        .map((f) => ({
          id: f.id,
          tipo: "fallida",
          canal: f.canal ?? "whatsapp",
          estado: "fallido",
          resumen: f.tipo ?? "Notificación fallida",
          error: f.error ?? null,
          creadoEn: f.created_at,
        })),
    ].sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[comunicaciones] Error inesperado:", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
