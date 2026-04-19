import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/reparaciones/[id]/pedidos-pieza/[pedidoId]/recibir
 * Marca un pedido de pieza como recibido con un solo clic.
 * - Actualiza estado → "recibida" + recibido_por + fecha_recibida
 * - Agrega a reparacion_piezas de la orden (como parte instalada)
 * - Si tiene producto_id → intenta incrementar stock
 * Body opcional: { costoReal?, costoEnvio?, notas? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pedidoId: string }> }
) {
  try {
    const { userId, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const { id: ordenId, pedidoId } = await params;
    const body = await request.json().catch(() => ({}));
    const { costoReal, costoEnvio, notas } = body as {
      costoReal?: number; costoEnvio?: number; notas?: string;
    };

    const supabase = createAdminClient();

    // Fetch pedido + order for access check
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos_pieza_reparacion")
      .select("*, ordenes_reparacion!inner(distribuidor_id)")
      .eq("id", pedidoId)
      .eq("orden_id", ordenId)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    const distId = (pedido as any).ordenes_reparacion?.distribuidor_id;
    if (!isSuperAdmin && distribuidorId && distId !== distribuidorId) {
      return NextResponse.json({ success: false, error: "Sin acceso" }, { status: 403 });
    }

    if (pedido.estado === "recibida") {
      return NextResponse.json({ success: false, error: "Este pedido ya fue recibido" }, { status: 409 });
    }
    if (pedido.estado === "cancelada") {
      return NextResponse.json({ success: false, error: "No se puede recibir un pedido cancelado" }, { status: 409 });
    }

    const costoFinal = costoReal !== undefined ? Number(costoReal) : Number(pedido.costo_estimado || 0);
    const envioFinal = costoEnvio !== undefined ? Number(costoEnvio) : Number(pedido.costo_envio || 0);
    const ahora = new Date().toISOString();

    // 1. Actualizar el pedido
    const { error: updateError } = await supabase
      .from("pedidos_pieza_reparacion")
      .update({
        estado: "recibida",
        fecha_recibida: ahora,
        recibido_por: userId,
        costo_estimado: costoFinal,
        costo_envio: envioFinal,
        ...(notas ? { notas } : {}),
      })
      .eq("id", pedidoId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // 2. Agregar a reparacion_piezas (parte instalada en la orden)
    await supabase.from("reparacion_piezas").insert({
      orden_id: ordenId,
      nombre_pieza: pedido.nombre_pieza,
      cantidad: 1,
      costo_unitario: costoFinal,
      producto_id: pedido.producto_id || null,
    });

    // 3. Si tiene producto_id, incrementar stock
    if (pedido.producto_id) {
      await supabase.rpc("incrementar_stock", {
        p_producto_id: pedido.producto_id,
        p_cantidad: 1,
      }).maybeSingle();
    }

    return NextResponse.json({ success: true, message: "Pieza recibida y agregada a la orden" });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
