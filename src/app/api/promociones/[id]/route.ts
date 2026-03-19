import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.titulo !== undefined) updates.titulo = body.titulo;
    if (body.descripcion !== undefined) updates.descripcion = body.descripcion;
    if (body.imagenUrl !== undefined) updates.imagen_url = body.imagenUrl;
    if (body.precioNormal !== undefined) updates.precio_normal = body.precioNormal;
    if (body.precioPromocion !== undefined) updates.precio_promocion = body.precioPromocion;
    if (body.categoria !== undefined) updates.categoria = body.categoria;
    if (body.activa !== undefined) updates.activa = body.activa;
    if (body.fechaInicio !== undefined) updates.fecha_inicio = body.fechaInicio;
    if (body.fechaFin !== undefined) updates.fecha_fin = body.fechaFin;
    const { error } = await supabase.from("promociones").update(updates).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
    }
    const { id } = await params;
    const supabase = createAdminClient();
    const { error } = await supabase.from("promociones").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
