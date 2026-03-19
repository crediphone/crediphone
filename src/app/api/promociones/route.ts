import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

function mapPromocion(p: any) {
  return {
    id: p.id,
    distribuidorId: p.distribuidor_id,
    titulo: p.titulo,
    descripcion: p.descripcion,
    imagenUrl: p.imagen_url,
    precioNormal: p.precio_normal ? Number(p.precio_normal) : undefined,
    precioPromocion: p.precio_promocion ? Number(p.precio_promocion) : undefined,
    categoria: p.categoria ?? "general",
    activa: p.activa,
    fechaInicio: p.fecha_inicio ? new Date(p.fecha_inicio) : undefined,
    fechaFin: p.fecha_fin ? new Date(p.fecha_fin) : undefined,
    createdBy: p.created_by,
    createdAt: new Date(p.created_at),
    updatedAt: new Date(p.updated_at),
  };
}

export async function GET() {
  try {
    const { userId, isSuperAdmin, distribuidorId } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    const supabase = createAdminClient();
    let q = supabase.from("promociones").select("*").order("created_at", { ascending: false });
    if (!isSuperAdmin && distribuidorId) q = q.eq("distribuidor_id", distribuidorId);
    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ success: true, data: (data ?? []).map(mapPromocion) });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al cargar promociones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
    }
    const body = await request.json();
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("promociones").insert({
      distribuidor_id: distribuidorId,
      titulo: body.titulo,
      descripcion: body.descripcion || null,
      imagen_url: body.imagenUrl || null,
      precio_normal: body.precioNormal || null,
      precio_promocion: body.precioPromocion || null,
      categoria: body.categoria ?? "general",
      activa: body.activa ?? true,
      fecha_inicio: body.fechaInicio || null,
      fecha_fin: body.fechaFin || null,
      created_by: userId,
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data: mapPromocion(data) });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al crear promoción" }, { status: 500 });
  }
}
