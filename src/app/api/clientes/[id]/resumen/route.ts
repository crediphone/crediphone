import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSaldoPuntos } from "@/lib/db/puntos";

/**
 * GET /api/clientes/[id]/resumen
 * Resumen financiero del cliente: órdenes activas, saldo pendiente y puntos.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const { id: clienteId } = await params;
    const supabase = createAdminClient();
    const distId = isSuperAdmin ? undefined : (distribuidorId ?? undefined);

    // Verificar acceso al cliente
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id, distribuidor_id")
      .eq("id", clienteId)
      .maybeSingle();

    if (!cliente) return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    if (!isSuperAdmin && distribuidorId && cliente.distribuidor_id !== distribuidorId) {
      return NextResponse.json({ success: false, error: "Sin acceso" }, { status: 403 });
    }

    // Órdenes activas (no canceladas, no entregadas)
    let ordenesQuery = supabase
      .from("ordenes_reparacion")
      .select("id, estado, costo_total, total_anticipos, folio")
      .eq("cliente_id", clienteId)
      .not("estado", "in", "(cancelado,entregado)");
    if (distId) ordenesQuery = ordenesQuery.eq("distribuidor_id", distId);

    const [{ data: ordenes }, saldo] = await Promise.all([
      ordenesQuery,
      getSaldoPuntos(clienteId, distId).catch(() => ({ saldoDisponible: 0, totalGanado: 0 })),
    ]);

    const ordenesActivas = (ordenes ?? []).length;
    const saldoPendiente = (ordenes ?? []).reduce(
      (sum, o) => sum + Math.max(0, Number(o.costo_total ?? 0) - Number(o.total_anticipos ?? 0)),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        ordenesActivas,
        saldoPendiente,
        puntos: saldo.saldoDisponible,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
