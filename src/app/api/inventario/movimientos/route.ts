import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/inventario/movimientos
 * Historial de movimientos de stock — solo admin/super_admin.
 * Filtros: fecha (YYYY-MM-DD), empleadoId, productoId, tipo
 */
export async function GET(request: Request) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fecha      = searchParams.get("fecha");      // YYYY-MM-DD
    const empleadoId = searchParams.get("empleadoId");
    const productoId = searchParams.get("productoId");
    const tipo       = searchParams.get("tipo");

    const supabase = createAdminClient();

    let query = supabase
      .from("movimientos_stock")
      .select(`
        id,
        tipo,
        cantidad,
        stock_antes,
        stock_despues,
        referencia_tipo,
        referencia_folio,
        notas,
        created_at,
        producto:producto_id ( id, nombre, marca, modelo ),
        registrado_por
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!isSuperAdmin && distribuidorId) {
      query = query.eq("distribuidor_id", distribuidorId);
    }

    if (fecha) {
      query = query.gte("created_at", `${fecha}T00:00:00Z`).lte("created_at", `${fecha}T23:59:59Z`);
    }
    if (empleadoId) query = query.eq("registrado_por", empleadoId);
    if (productoId) query = query.eq("producto_id", productoId);
    if (tipo)       query = query.eq("tipo", tipo);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("Error en GET /api/inventario/movimientos:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
