import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/reparaciones/[id]/pedidos-pieza
 * Lista los pedidos de piezas de una orden.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const { id: ordenId } = await params;
    const supabase = createAdminClient();

    // Verify access to the order
    const { data: orden } = await supabase
      .from("ordenes_reparacion")
      .select("id, distribuidor_id")
      .eq("id", ordenId)
      .single();

    if (!orden) return NextResponse.json({ success: false, error: "Orden no encontrada" }, { status: 404 });
    if (!isSuperAdmin && distribuidorId && orden.distribuidor_id !== distribuidorId) {
      return NextResponse.json({ success: false, error: "Sin acceso" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("pedidos_pieza_reparacion")
      .select(`
        id, nombre_pieza, costo_estimado, costo_envio, estado,
        created_at, fecha_recibida, notas, producto_id,
        creadoPor:creado_por (name),
        recibidoPor:recibido_por (name)
      `)
      .eq("orden_id", ordenId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const mapped = (data || []).map((p: any) => ({
      id: p.id,
      nombrePieza: p.nombre_pieza,
      costoEstimado: Number(p.costo_estimado || 0),
      costoEnvio: Number(p.costo_envio || 0),
      estado: p.estado,
      createdAt: p.created_at,
      fechaRecibida: p.fecha_recibida,
      notas: p.notas,
      productoId: p.producto_id,
      creadoPorNombre: p.creadoPor?.name ?? null,
      recibidoPorNombre: p.recibidoPor?.name ?? null,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

/**
 * POST /api/reparaciones/[id]/pedidos-pieza
 * Crea un nuevo pedido de pieza para la orden.
 * Body: { nombrePieza, costoEstimado, costoEnvio?, notas?, productoId?, recibirInmediatamente? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const { id: ordenId } = await params;
    const body = await request.json();
    const { nombrePieza, costoEstimado = 0, costoEnvio = 0, notas, productoId, recibirInmediatamente = false } = body;

    if (!nombrePieza?.trim()) {
      return NextResponse.json({ success: false, error: "nombrePieza es requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify order access
    const { data: orden } = await supabase
      .from("ordenes_reparacion")
      .select("id, distribuidor_id")
      .eq("id", ordenId)
      .single();

    if (!orden) return NextResponse.json({ success: false, error: "Orden no encontrada" }, { status: 404 });
    if (!isSuperAdmin && distribuidorId && orden.distribuidor_id !== distribuidorId) {
      return NextResponse.json({ success: false, error: "Sin acceso" }, { status: 403 });
    }

    const estadoInicial = recibirInmediatamente ? "recibida" : "pendiente";
    const ahora = new Date().toISOString();

    const { data: pedido, error } = await supabase
      .from("pedidos_pieza_reparacion")
      .insert({
        orden_id: ordenId,
        distribuidor_id: orden.distribuidor_id,
        nombre_pieza: nombrePieza.trim(),
        costo_estimado: Number(costoEstimado) || 0,
        costo_envio: Number(costoEnvio) || 0,
        estado: estadoInicial,
        creado_por: userId,
        notas: notas?.trim() || null,
        producto_id: productoId || null,
        ...(recibirInmediatamente ? { fecha_recibida: ahora, recibido_por: userId } : {}),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    // Si se recibe inmediatamente, agregar a reparacion_piezas
    if (recibirInmediatamente) {
      await supabase.from("reparacion_piezas").insert({
        orden_id: ordenId,
        nombre_pieza: nombrePieza.trim(),
        cantidad: 1,
        costo_unitario: Number(costoEstimado) || 0,
        producto_id: productoId || null,
      });

      // Si tiene producto_id, incrementar stock
      if (productoId) {
        await supabase.rpc("incrementar_stock", { p_producto_id: productoId, p_cantidad: 1 }).maybeSingle();
      }
    }

    return NextResponse.json({ success: true, data: { id: pedido.id, estado: pedido.estado } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
