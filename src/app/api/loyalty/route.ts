/**
 * GET /api/loyalty
 * Retorna ranking de puntos del año actual para todos los clientes del distribuidor.
 * Solo accesible por admin y super_admin.
 */

import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permisos" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const año = new Date().getFullYear();
    const distId = isSuperAdmin ? undefined : (distribuidorId ?? undefined);

    // Obtener puntos del año actual con info del cliente
    let q = supabase
      .from("puntos_cliente")
      .select(`
        id, saldo_disponible, total_ganado, total_canjeado, anio,
        clientes:cliente_id (id, nombre, apellido, telefono)
      `)
      .eq("anio", año)
      .order("total_ganado", { ascending: false });

    if (distId) {
      q = q.eq("distribuidor_id", distId);
    } else {
      q = q.is("distribuidor_id", null);
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const rows = (data ?? []).map((r: any) => ({
      clienteId:       r.clientes?.id ?? "",
      nombre:          `${r.clientes?.nombre ?? ""} ${r.clientes?.apellido ?? ""}`.trim(),
      telefono:        r.clientes?.telefono ?? null,
      saldoDisponible: r.saldo_disponible,
      totalGanado:     r.total_ganado,
      totalCanjeado:   r.total_canjeado,
      año:             r.anio,
    }));

    // Totales del año
    const totales = {
      clientesConPuntos: rows.length,
      totalPuntosEnCirculacion: rows.reduce((s, r) => s + r.saldoDisponible, 0),
      totalPuntosGanados:       rows.reduce((s, r) => s + r.totalGanado, 0),
      totalPuntosCanjeados:     rows.reduce((s, r) => s + r.totalCanjeado, 0),
    };

    return NextResponse.json({ success: true, data: { rows, totales, año } });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
