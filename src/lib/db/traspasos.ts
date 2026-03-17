/**
 * FASE 37: Capa de base de datos para traspasos_anticipo
 * Flujo: Técnico registra anticipo en efectivo → crea traspaso pendiente
 *        Vendedor confirma monto recibido → entra a caja con el monto real
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { TraspasoAnticipo } from "@/types";

function mapTraspasoFromDB(row: Record<string, unknown>): TraspasoAnticipo {
  return {
    id: row.id as string,
    distribuidorId: (row.distribuidor_id as string) || undefined,
    reparacionId: row.reparacion_id as string,
    anticipoId: row.anticipo_id as string,
    tecnicoId: row.tecnico_id as string,
    vendedorId: (row.vendedor_id as string) || undefined,
    folioOrden: row.folio_orden as string,
    clienteNombre: row.cliente_nombre as string,
    montoRegistrado: parseFloat(row.monto_registrado as string),
    montoConfirmado: row.monto_confirmado != null ? parseFloat(row.monto_confirmado as string) : undefined,
    estado: row.estado as TraspasoAnticipo["estado"],
    confirmadoAt: row.confirmado_at ? new Date(row.confirmado_at as string) : undefined,
    discrepancia: row.discrepancia != null ? parseFloat(row.discrepancia as string) : undefined,
    notasVendedor: (row.notas_vendedor as string) || undefined,
    createdAt: new Date(row.created_at as string),
    // Joins opcionales
    tecnicoNombre: (row.tecnico_nombre as string) || undefined,
    vendedorNombre: (row.vendedor_nombre as string) || undefined,
  };
}

/** Crea un traspaso pendiente cuando el técnico registra un anticipo en efectivo */
export async function createTraspasoAnticipo(params: {
  distribuidorId?: string;
  reparacionId: string;
  anticipoId: string;
  tecnicoId: string;
  folioOrden: string;
  clienteNombre: string;
  montoRegistrado: number;
}): Promise<TraspasoAnticipo> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("traspasos_anticipo")
    .insert([{
      distribuidor_id: params.distribuidorId || null,
      reparacion_id: params.reparacionId,
      anticipo_id: params.anticipoId,
      tecnico_id: params.tecnicoId,
      folio_orden: params.folioOrden,
      cliente_nombre: params.clienteNombre,
      monto_registrado: params.montoRegistrado,
      estado: "pendiente",
    }])
    .select()
    .single();

  if (error) throw new Error(`Error al crear traspaso: ${error.message}`);
  return mapTraspasoFromDB(data as unknown as Record<string, unknown>);
}

/** Lista traspasos pendientes para un distribuidor (con nombres del técnico) */
export async function getTraspasosPendientes(distribuidorId?: string): Promise<TraspasoAnticipo[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("traspasos_anticipo")
    .select("*")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  if (distribuidorId) {
    query = query.eq("distribuidor_id", distribuidorId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error al obtener traspasos pendientes: ${error.message}`);

  const traspasos = (data || []).map((row) => mapTraspasoFromDB(row as unknown as Record<string, unknown>));

  // Enriquecer con nombres de usuarios
  if (traspasos.length > 0) {
    const tecnicoIds = [...new Set(traspasos.map((t) => t.tecnicoId))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", tecnicoIds);

    const userMap = new Map((users || []).map((u: Record<string, unknown>) => [u.id, u.name || u.email]));
    traspasos.forEach((t) => {
      t.tecnicoNombre = (userMap.get(t.tecnicoId) as string) || "Técnico";
    });
  }

  return traspasos;
}

/** Lista todos los traspasos (con filtro de estado opcional) */
export async function getTraspasos(params: {
  distribuidorId?: string;
  estado?: TraspasoAnticipo["estado"];
  limit?: number;
}): Promise<TraspasoAnticipo[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("traspasos_anticipo")
    .select("*")
    .order("created_at", { ascending: false });

  if (params.distribuidorId) query = query.eq("distribuidor_id", params.distribuidorId);
  if (params.estado) query = query.eq("estado", params.estado);
  if (params.limit) query = query.limit(params.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Error al obtener traspasos: ${error.message}`);

  return (data || []).map((row) => mapTraspasoFromDB(row as unknown as Record<string, unknown>));
}

/**
 * Vendedor confirma el monto real recibido.
 * - Si montoConfirmado == montoRegistrado → estado: 'confirmado'
 * - Si difieren → estado: 'discrepancia' + calcula diferencia
 * Retorna el traspaso actualizado Y si hubo discrepancia.
 */
export async function confirmarTraspaso(params: {
  traspasoId: string;
  vendedorId: string;
  montoConfirmado: number;
  notasVendedor?: string;
  sesionCajaId?: string; // para registrar en caja el monto confirmado
  folioOrden?: string;
}): Promise<{ traspaso: TraspasoAnticipo; hayDiscrepancia: boolean }> {
  const supabase = createAdminClient();

  // Obtener el traspaso actual
  const { data: traspasoData, error: fetchError } = await supabase
    .from("traspasos_anticipo")
    .select("*")
    .eq("id", params.traspasoId)
    .single();

  if (fetchError || !traspasoData) {
    throw new Error("Traspaso no encontrado");
  }

  const traspaso = mapTraspasoFromDB(traspasoData as unknown as Record<string, unknown>);

  if (traspaso.estado !== "pendiente") {
    throw new Error("Este traspaso ya fue procesado");
  }

  const diff = traspaso.montoRegistrado - params.montoConfirmado;
  const hayDiscrepancia = Math.abs(diff) > 0.01; // tolerancia de 1 centavo
  const nuevoEstado: TraspasoAnticipo["estado"] = hayDiscrepancia ? "discrepancia" : "confirmado";

  // Actualizar el traspaso
  const { data: updatedData, error: updateError } = await supabase
    .from("traspasos_anticipo")
    .update({
      vendedor_id: params.vendedorId,
      monto_confirmado: params.montoConfirmado,
      estado: nuevoEstado,
      confirmado_at: new Date().toISOString(),
      discrepancia: hayDiscrepancia ? diff : null,
      notas_vendedor: params.notasVendedor || null,
    })
    .eq("id", params.traspasoId)
    .select()
    .single();

  if (updateError) throw new Error(`Error al confirmar traspaso: ${updateError.message}`);

  // Registrar el monto CONFIRMADO en caja (si hay sesión activa)
  if (params.sesionCajaId && params.montoConfirmado > 0) {
    try {
      await supabase.from("caja_movimientos").insert([{
        sesion_id: params.sesionCajaId,
        tipo: "entrada_anticipo",
        monto: params.montoConfirmado,
        concepto: `Anticipo reparación ${params.folioOrden || traspaso.folioOrden} (confirmado por vendedor)`,
        referencia_id: traspaso.anticipoId,
        distribuidor_id: traspaso.distribuidorId || null,
      }]);
    } catch (cajaErr) {
      console.error("No se pudo registrar traspaso confirmado en caja:", cajaErr);
      // No fallar el proceso de confirmación si la caja falla
    }
  }

  return {
    traspaso: mapTraspasoFromDB(updatedData as unknown as Record<string, unknown>),
    hayDiscrepancia,
  };
}

/** Obtiene el traspaso asociado a un anticipo específico (si existe) */
export async function getTraspasoByAnticipoId(anticipoId: string): Promise<TraspasoAnticipo | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("traspasos_anticipo")
    .select("*")
    .eq("anticipo_id", anticipoId)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener traspaso: ${error.message}`);
  if (!data) return null;

  return mapTraspasoFromDB(data as unknown as Record<string, unknown>);
}

/** Cuenta traspasos pendientes para un distribuidor (para el badge en sidebar/dashboard) */
export async function countTraspasosPendientes(distribuidorId?: string): Promise<number> {
  const supabase = createAdminClient();

  let query = supabase
    .from("traspasos_anticipo")
    .select("*", { count: "exact", head: true })
    .eq("estado", "pendiente");

  if (distribuidorId) query = query.eq("distribuidor_id", distribuidorId);

  const { count, error } = await query;
  if (error) return 0;
  return count || 0;
}
