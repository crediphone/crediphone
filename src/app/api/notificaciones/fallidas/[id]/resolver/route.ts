import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/whatsapp-api";

/**
 * POST /api/notificaciones/fallidas/[id]/resolver
 * Marca la notificación como resuelta y, si es WhatsApp, reintenta el envío.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    let query = supabase
      .from("notificaciones_fallidas")
      .select("id, tipo, telefono, mensaje, intentos, resuelto, distribuidor_id")
      .eq("id", id);

    if (!isSuperAdmin && distribuidorId) {
      query = query.eq("distribuidor_id", distribuidorId);
    }

    const { data: nf } = await query.single();
    if (!nf) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
    if (nf.resuelto) return NextResponse.json({ success: true, message: "Ya estaba resuelta" });

    let reintentado = false;
    let errorReintento: string | null = null;

    // Reintentar WhatsApp si aplica
    if (nf.tipo === "whatsapp" && nf.telefono && nf.mensaje) {
      try {
        await sendWhatsApp({
          telefono: nf.telefono,
          mensaje: nf.mensaje,
          distribuidorId: nf.distribuidor_id ?? undefined,
        });
        reintentado = true;
      } catch (e) {
        errorReintento = e instanceof Error ? e.message : String(e);
        // Incrementar intentos pero no marcar como resuelto
        await supabase
          .from("notificaciones_fallidas")
          .update({ intentos: (nf.intentos ?? 1) + 1, error: errorReintento })
          .eq("id", id);
        return NextResponse.json({ success: false, error: `Reenvío fallido: ${errorReintento}` }, { status: 502 });
      }
    }

    // Marcar como resuelta
    await supabase
      .from("notificaciones_fallidas")
      .update({
        resuelto: true,
        resuelto_por: userId,
        resuelto_at: new Date().toISOString(),
        intentos: (nf.intentos ?? 1) + (reintentado ? 1 : 0),
      })
      .eq("id", id);

    return NextResponse.json({ success: true, reintentado });
  } catch (error) {
    console.error("Error en POST /api/notificaciones/fallidas/[id]/resolver:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
