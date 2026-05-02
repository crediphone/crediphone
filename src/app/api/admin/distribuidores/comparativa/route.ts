import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/distribuidores/comparativa
 * Solo super_admin. Devuelve KPIs clave por cada distribuidor activo.
 */
export async function GET() {
  try {
    const { userId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!isSuperAdmin) return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });

    const supabase = createAdminClient();

    // Distribuidores activos
    const { data: distribuidores, error: distErr } = await supabase
      .from("distribuidores")
      .select("id, nombre, slug, acceso_habilitado")
      .eq("activo", true)
      .order("nombre");

    if (distErr) throw distErr;
    if (!distribuidores || distribuidores.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
    const fin7dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Órdenes activas (no terminadas)
    const { data: ordenesActivas } = await supabase
      .from("ordenes_reparacion")
      .select("distribuidor_id, estado")
      .not("estado", "in", '("entregado","cancelado","no_reparable")');

    // Entregadas hoy
    const { data: entregadasHoy } = await supabase
      .from("ordenes_reparacion")
      .select("distribuidor_id, costo_total")
      .eq("estado", "entregado")
      .gte("updated_at", inicioHoy);

    // Entregadas últimos 7 días
    const { data: entregadas7d } = await supabase
      .from("ordenes_reparacion")
      .select("distribuidor_id, costo_total")
      .eq("estado", "entregado")
      .gte("updated_at", fin7dias);

    // Listas para entrega
    const { data: listasEntrega } = await supabase
      .from("ordenes_reparacion")
      .select("distribuidor_id")
      .eq("estado", "listo_entrega");

    // Construir mapa por distribuidor_id
    const kpiMap: Record<string, {
      activas: number;
      listasEntrega: number;
      cobradoHoy: number;
      ingreso7d: number;
      entregadas7d: number;
    }> = {};

    for (const d of distribuidores) {
      kpiMap[d.id] = { activas: 0, listasEntrega: 0, cobradoHoy: 0, ingreso7d: 0, entregadas7d: 0 };
    }

    for (const o of ordenesActivas ?? []) {
      if (kpiMap[o.distribuidor_id]) kpiMap[o.distribuidor_id].activas++;
    }
    for (const o of listasEntrega ?? []) {
      if (kpiMap[o.distribuidor_id]) kpiMap[o.distribuidor_id].listasEntrega++;
    }
    for (const o of entregadasHoy ?? []) {
      if (kpiMap[o.distribuidor_id]) kpiMap[o.distribuidor_id].cobradoHoy += Number(o.costo_total ?? 0);
    }
    for (const o of entregadas7d ?? []) {
      if (kpiMap[o.distribuidor_id]) {
        kpiMap[o.distribuidor_id].ingreso7d += Number(o.costo_total ?? 0);
        kpiMap[o.distribuidor_id].entregadas7d++;
      }
    }

    const data = distribuidores.map((d) => ({
      id: d.id,
      nombre: d.nombre,
      slug: d.slug,
      accesoHabilitado: d.acceso_habilitado ?? true,
      ...kpiMap[d.id],
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[comparativa] Error:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
