import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/reparaciones/[id]/historial-precios
 * Historial de cambios de precio de la orden — solo admin/super_admin.
 */
export async function GET(
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

    // Verificar acceso a la orden
    const { data: orden } = await supabase
      .from("ordenes_reparacion")
      .select("distribuidor_id")
      .eq("id", id)
      .single();

    if (!orden) return NextResponse.json({ success: false, error: "Orden no encontrada" }, { status: 404 });
    if (!isSuperAdmin && distribuidorId && orden.distribuidor_id !== distribuidorId) {
      return NextResponse.json({ success: false, error: "Sin acceso" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("historial_precios_orden")
      .select("id, precio_anterior, precio_nuevo, costo_reparacion_anterior, costo_partes_anterior, costo_reparacion_nuevo, costo_partes_nuevo, motivo, via, created_at, cambiado_por")
      .eq("orden_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("Error en GET /api/reparaciones/[id]/historial-precios:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
