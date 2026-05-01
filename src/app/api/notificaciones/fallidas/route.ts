import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET  /api/notificaciones/fallidas  — lista notificaciones fallidas (admin)
 * POST /api/notificaciones/fallidas/[id]/resolver — marcar como resuelta + reenvío
 */
export async function GET(request: Request) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const soloNoResueltas = searchParams.get("resuelto") !== "true";

    const supabase = createAdminClient();

    let query = supabase
      .from("notificaciones_fallidas")
      .select(`
        id, tipo, canal, telefono, mensaje, error, intentos,
        resuelto, resuelto_at, created_at,
        orden:orden_id ( id, folio, estado )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!isSuperAdmin && distribuidorId) {
      query = query.eq("distribuidor_id", distribuidorId);
    }
    if (soloNoResueltas) {
      query = query.eq("resuelto", false);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [], total: (data ?? []).length });
  } catch (error) {
    console.error("Error en GET /api/notificaciones/fallidas:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
