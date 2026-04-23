/**
 * Sistema de puntos / loyalty — CREDIPHONE
 *
 * Reglas de negocio:
 *   - $50 gastados = 1 punto
 *   - 1 punto = $1 MXN de descuento
 *   - Los puntos acumulan durante el anio calendario y se reinician el 1 enero
 */

import { createAdminClient } from "@/lib/supabase/admin";

export const PESOS_POR_PUNTO = 50;  // $50 = 1 punto
export const VALOR_PUNTO_MXN = 1;   // 1 punto = $1 descuento

export interface SaldoPuntos {
  saldoDisponible: number;
  totalGanado: number;
  totalCanjeado: number;
  anio: number;
}

export interface MovimientoPuntos {
  id: string;
  tipo: "ganado" | "canjeado" | "expirado";
  puntos: number;
  montoReferencia: number | null;
  descripcion: string;
  referenciaTipo: "reparacion" | "venta_pos" | null;
  referenciaId: string | null;
  createdAt: string;
}

function añoActual(): number {
  return new Date().getFullYear();
}

/**
 * Calcula cuántos puntos corresponden a un monto.
 */
export function calcularPuntos(monto: number): number {
  return Math.floor(monto / PESOS_POR_PUNTO);
}

/**
 * Calcula el descuento en pesos que equivale a N puntos.
 */
export function puntosADescuento(puntos: number): number {
  return puntos * VALOR_PUNTO_MXN;
}

/**
 * Obtiene el saldo de puntos de un cliente para el anio dado (default: anio actual).
 * Devuelve saldo en cero si no existe registro previo.
 */
export async function getSaldoPuntos(
  clienteId: string,
  distribuidorId: string | undefined,
  anio?: number
): Promise<SaldoPuntos> {
  const supabase = createAdminClient();
  const targetAño = anio ?? añoActual();

  let q = supabase
    .from("puntos_cliente")
    .select("saldo_disponible, total_ganado, total_canjeado, anio")
    .eq("cliente_id", clienteId)
    .eq("anio", targetAño);

  if (distribuidorId) {
    q = q.eq("distribuidor_id", distribuidorId);
  } else {
    q = q.is("distribuidor_id", null);
  }

  const { data } = await q.maybeSingle();

  return {
    saldoDisponible: data?.saldo_disponible ?? 0,
    totalGanado:     data?.total_ganado ?? 0,
    totalCanjeado:   data?.total_canjeado ?? 0,
    anio:             targetAño,
  };
}

/**
 * Obtiene el historial de movimientos de un cliente para el anio dado.
 */
export async function getHistorialPuntos(
  clienteId: string,
  distribuidorId: string | undefined,
  anio?: number
): Promise<MovimientoPuntos[]> {
  const supabase = createAdminClient();
  const targetAño = anio ?? añoActual();

  let q = supabase
    .from("movimientos_puntos")
    .select("id, tipo, puntos, monto_referencia, descripcion, referencia_tipo, referencia_id, created_at")
    .eq("cliente_id", clienteId)
    .eq("anio", targetAño)
    .order("created_at", { ascending: false });

  if (distribuidorId) {
    q = q.eq("distribuidor_id", distribuidorId);
  } else {
    q = q.is("distribuidor_id", null);
  }

  const { data } = await q;

  return (data ?? []).map((r: any) => ({
    id:              r.id,
    tipo:            r.tipo,
    puntos:          r.puntos,
    montoReferencia: r.monto_referencia != null ? parseFloat(r.monto_referencia) : null,
    descripcion:     r.descripcion,
    referenciaTipo:  r.referencia_tipo ?? null,
    referenciaId:    r.referencia_id ?? null,
    createdAt:       r.created_at,
  }));
}

/**
 * Acumula puntos para un cliente basándose en el monto gastado.
 * Fire-and-forget seguro: nunca lanza, solo loguea en caso de error.
 * Solo acumula si clienteId está presente y el monto genera al menos 1 punto.
 */
export async function acumularPuntos(opts: {
  clienteId: string | null | undefined;
  distribuidorId: string | undefined;
  monto: number;
  referenciaId: string;
  referenciaTipo: "reparacion" | "venta_pos";
  descripcion: string;
}): Promise<number> {
  if (!opts.clienteId) return 0;

  const puntos = calcularPuntos(opts.monto);
  if (puntos <= 0) return 0;

  const supabase = createAdminClient();
  const anio = añoActual();

  try {
    // Upsert en puntos_cliente
    const { error: upsertError } = await supabase.rpc("incrementar_puntos_cliente", {
      p_cliente_id:      opts.clienteId,
      p_distribuidor_id: opts.distribuidorId ?? null,
      p_anio:             anio,
      p_puntos:          puntos,
    });

    if (upsertError) {
      // Fallback manual si el RPC no existe aún
      await upsertPuntosManual(supabase, opts.clienteId, opts.distribuidorId, anio, puntos, 0);
    }

    // Registrar movimiento
    await supabase.from("movimientos_puntos").insert({
      cliente_id:       opts.clienteId,
      distribuidor_id:  opts.distribuidorId ?? null,
      tipo:             "ganado",
      puntos,
      monto_referencia: opts.monto,
      descripcion:      opts.descripcion,
      referencia_tipo:  opts.referenciaTipo,
      referencia_id:    opts.referenciaId,
      anio,
    });

    return puntos;
  } catch (err) {
    console.error("[puntos] Error al acumular puntos:", err);
    return 0;
  }
}

/**
 * Canjea puntos de un cliente como descuento.
 * Verifica que haya saldo suficiente antes de aplicar.
 * Retorna el descuento en MXN aplicado.
 */
export async function canjearPuntos(opts: {
  clienteId: string;
  distribuidorId: string | undefined;
  puntos: number;
  referenciaId: string;
  referenciaTipo: "reparacion" | "venta_pos";
  descripcion: string;
}): Promise<{ ok: boolean; puntosCanjeados: number; descuentoMXN: number; error?: string }> {
  if (opts.puntos <= 0) {
    return { ok: false, puntosCanjeados: 0, descuentoMXN: 0, error: "Puntos inválidos" };
  }

  const supabase = createAdminClient();
  const anio = añoActual();

  // Verificar saldo
  const saldo = await getSaldoPuntos(opts.clienteId, opts.distribuidorId, anio);
  if (saldo.saldoDisponible < opts.puntos) {
    return {
      ok: false,
      puntosCanjeados: 0,
      descuentoMXN: 0,
      error: `Saldo insuficiente. Disponible: ${saldo.saldoDisponible} pts`,
    };
  }

  try {
    await upsertPuntosManual(supabase, opts.clienteId, opts.distribuidorId, anio, 0, opts.puntos);

    await supabase.from("movimientos_puntos").insert({
      cliente_id:       opts.clienteId,
      distribuidor_id:  opts.distribuidorId ?? null,
      tipo:             "canjeado",
      puntos:           -opts.puntos,
      monto_referencia: null,
      descripcion:      opts.descripcion,
      referencia_tipo:  opts.referenciaTipo,
      referencia_id:    opts.referenciaId,
      anio,
    });

    return {
      ok:              true,
      puntosCanjeados: opts.puntos,
      descuentoMXN:    puntosADescuento(opts.puntos),
    };
  } catch (err) {
    console.error("[puntos] Error al canjear puntos:", err);
    return { ok: false, puntosCanjeados: 0, descuentoMXN: 0, error: "Error interno" };
  }
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

async function upsertPuntosManual(
  supabase: ReturnType<typeof createAdminClient>,
  clienteId: string,
  distribuidorId: string | undefined,
  anio: number,
  puntosGanados: number,
  puntosCanjeados: number
) {
  // Buscar fila existente
  let q = supabase
    .from("puntos_cliente")
    .select("id, saldo_disponible, total_ganado, total_canjeado")
    .eq("cliente_id", clienteId)
    .eq("anio", anio);

  if (distribuidorId) {
    q = q.eq("distribuidor_id", distribuidorId);
  } else {
    q = q.is("distribuidor_id", null);
  }

  const { data: existing } = await q.maybeSingle();

  if (existing) {
    await supabase
      .from("puntos_cliente")
      .update({
        saldo_disponible: existing.saldo_disponible + puntosGanados - puntosCanjeados,
        total_ganado:     existing.total_ganado + puntosGanados,
        total_canjeado:   existing.total_canjeado + puntosCanjeados,
        updated_at:       new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("puntos_cliente").insert({
      cliente_id:       clienteId,
      distribuidor_id:  distribuidorId ?? null,
      anio,
      saldo_disponible: puntosGanados - puntosCanjeados,
      total_ganado:     puntosGanados,
      total_canjeado:   puntosCanjeados,
    });
  }
}
