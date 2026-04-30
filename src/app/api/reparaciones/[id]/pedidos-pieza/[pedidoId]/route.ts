import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PATCH /api/reparaciones/[id]/pedidos-pieza/[pedidoId]
 * Actualiza la fecha estimada y/o motivo de retraso de una pieza ya pedida.
 * Funciona en estados pendiente y en_camino.
 * Body: { fechaEstimadaLlegada?: string; motivoRetraso?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pedidoId: string }> }
) {
  try {
    const { userId, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const { id: ordenId, pedidoId } = await params;
    const body = await request.json().catch(() => ({}));
    const { fechaEstimadaLlegada, motivoRetraso } = body as {
      fechaEstimadaLlegada?: string;
      motivoRetraso?: string;
    };

    if (!fechaEstimadaLlegada && !motivoRetraso) {
      return NextResponse.json(
        { success: false, error: "Se requiere fechaEstimadaLlegada o motivoRetraso" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: pedido } = await supabase
      .from("pedidos_pieza_reparacion")
      .select("id, estado, notas, nombre_pieza, ordenes_reparacion!inner(distribuidor_id)")
      .eq("id", pedidoId)
      .eq("orden_id", ordenId)
      .single();

    if (!pedido) return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });

    const distId = (pedido as any).ordenes_reparacion?.distribuidor_id;
    if (!isSuperAdmin && distribuidorId && distId !== distribuidorId) {
      return NextResponse.json({ success: false, error: "Sin acceso" }, { status: 403 });
    }

    if (!["pendiente", "en_camino"].includes(pedido.estado)) {
      return NextResponse.json(
        { success: false, error: "Solo se puede actualizar piezas en estado pendiente o en_camino" },
        { status: 409 }
      );
    }

    // Append motivo to notas
    let nuevasNotas = pedido.notas ?? "";
    if (motivoRetraso?.trim()) {
      const fecha = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
      const sufijo = `[${fecha}] Retraso: ${motivoRetraso.trim()}`;
      nuevasNotas = nuevasNotas ? `${nuevasNotas}\n${sufijo}` : sufijo;
    }

    const updateData: Record<string, unknown> = { notas: nuevasNotas || null };
    if (fechaEstimadaLlegada) {
      updateData.fecha_estimada_llegada = fechaEstimadaLlegada;
    }

    const { error } = await supabase
      .from("pedidos_pieza_reparacion")
      .update(updateData)
      .eq("id", pedidoId);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      message: "Pieza actualizada",
      nombrePieza: pedido.nombre_pieza,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
