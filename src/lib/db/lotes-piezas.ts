/**
 * Funciones de base de datos para el módulo de Lotes de Piezas (FASE 42)
 * Gestión de órdenes de compra con distribución de costo de envío
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  LotePiezas,
  LotePiezasItem,
  LotePiezasFormData,
  EstadoLotePiezas,
} from "@/types";

// =====================================================
// FUNCIONES HELPER: Mapeo DB → TypeScript
// =====================================================

function mapLotePiezasFromDB(db: any): LotePiezas {
  return {
    id: db.id,
    distribuidorId: db.distribuidor_id,
    proveedor: db.proveedor,
    numeroPedido: db.numero_pedido || undefined,
    fechaPedido: new Date(db.fecha_pedido),
    fechaEstimadaLlegada: db.fecha_estimada_llegada
      ? new Date(db.fecha_estimada_llegada)
      : undefined,
    fechaLlegada: db.fecha_llegada ? new Date(db.fecha_llegada) : undefined,
    costoEnvioTotal: parseFloat(db.costo_envio_total || 0),
    estado: db.estado,
    notas: db.notas || undefined,
    recibidoPor: db.recibido_por || undefined,
    createdBy: db.created_by,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
    items: db.items ? db.items.map(mapLotePiezasItemFromDB) : undefined,
    cantidadItems: db.cantidad_items || undefined,
  };
}

function mapLotePiezasItemFromDB(db: any): LotePiezasItem {
  return {
    id: db.id,
    loteId: db.lote_id,
    reparacionId: db.reparacion_id || undefined,
    descripcion: db.descripcion,
    cantidadPedida: db.cantidad_pedida,
    cantidadRecibida: db.cantidad_recibida || undefined,
    costoUnitario: db.costo_unitario ? parseFloat(db.costo_unitario) : undefined,
    estadoItem: db.estado_item,
    notas: db.notas || undefined,
    createdAt: new Date(db.created_at),
  };
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Obtiene todos los lotes de un distribuidor
 */
export async function getLotes(
  distribuidorId?: string,
  estado?: EstadoLotePiezas
): Promise<LotePiezas[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("lotes_piezas")
    .select(
      `
      id,
      distribuidor_id,
      proveedor,
      numero_pedido,
      fecha_pedido,
      fecha_estimada_llegada,
      fecha_llegada,
      costo_envio_total,
      estado,
      notas,
      recibido_por,
      created_by,
      created_at,
      updated_at,
      lotes_piezas_items(count)
    `
    )
    .order("created_at", { ascending: false });

  if (distribuidorId) {
    query = query.eq("distribuidor_id", distribuidorId);
  }

  if (estado) {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching lotes:", error);
    throw error;
  }

  return (data || []).map((lote: any) => ({
    ...mapLotePiezasFromDB(lote),
    cantidadItems: lote.lotes_piezas_items?.[0]?.count || 0,
  }));
}

/**
 * Obtiene un lote específico con todos sus items
 */
export async function getLoteById(id: string): Promise<LotePiezas | null> {
  const supabase = createAdminClient();

  const { data: lote, error } = await supabase
    .from("lotes_piezas")
    .select(`
      id,
      distribuidor_id,
      proveedor,
      numero_pedido,
      fecha_pedido,
      fecha_estimada_llegada,
      fecha_llegada,
      costo_envio_total,
      estado,
      notas,
      recibido_por,
      created_by,
      created_at,
      updated_at,
      lotes_piezas_items(
        id,
        lote_id,
        reparacion_id,
        descripcion,
        cantidad_pedida,
        cantidad_recibida,
        costo_unitario,
        estado_item,
        notas,
        created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching lote:", error);
    return null;
  }

  if (!lote) return null;

  return {
    ...mapLotePiezasFromDB(lote),
    items: lote.lotes_piezas_items.map(mapLotePiezasItemFromDB),
  };
}

/**
 * Crea un nuevo lote de piezas
 */
export async function createLote(
  data: LotePiezasFormData,
  distribuidorId: string,
  createdBy: string
): Promise<LotePiezas> {
  const supabase = createAdminClient();

  const insertData = {
    distribuidor_id: distribuidorId,
    proveedor: data.proveedor,
    numero_pedido: data.numeroPedido || null,
    fecha_pedido: data.fechaPedido,
    fecha_estimada_llegada: data.fechaEstimadaLlegada || null,
    fecha_llegada: data.fechaLlegada || null,
    costo_envio_total: data.costoEnvioTotal || 0,
    estado: data.estado || "pedido",
    notas: data.notas || null,
    created_by: createdBy,
  };

  const { data: lote, error } = await supabase
    .from("lotes_piezas")
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error("Error creating lote:", error);
    throw error;
  }

  return mapLotePiezasFromDB(lote);
}

/**
 * Actualiza un lote existente
 */
export async function updateLote(
  id: string,
  data: Partial<LotePiezasFormData>
): Promise<LotePiezas> {
  const supabase = createAdminClient();

  const updateData: Record<string, any> = {};

  if (data.proveedor) updateData.proveedor = data.proveedor;
  if (data.numeroPedido) updateData.numero_pedido = data.numeroPedido;
  if (data.fechaPedido) updateData.fecha_pedido = data.fechaPedido;
  if (data.fechaEstimadaLlegada) updateData.fecha_estimada_llegada = data.fechaEstimadaLlegada;
  if (data.fechaLlegada) updateData.fecha_llegada = data.fechaLlegada;
  if (data.costoEnvioTotal !== undefined)
    updateData.costo_envio_total = data.costoEnvioTotal;
  if (data.estado) updateData.estado = data.estado;
  if (data.notas !== undefined) updateData.notas = data.notas;

  updateData.updated_at = new Date().toISOString();

  const { data: lote, error } = await supabase
    .from("lotes_piezas")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating lote:", error);
    throw error;
  }

  return mapLotePiezasFromDB(lote);
}

/**
 * Marca un lote como recibido por un usuario específico
 */
export async function marcarLoteRecibido(
  id: string,
  recibidoPor: string
): Promise<LotePiezas> {
  const supabase = createAdminClient();

  const { data: lote, error } = await supabase
    .from("lotes_piezas")
    .update({
      estado: "recibido",
      recibido_por: recibidoPor,
      fecha_llegada: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error marking lote as received:", error);
    throw error;
  }

  return mapLotePiezasFromDB(lote);
}

/**
 * Elimina un lote y todos sus items
 */
export async function deleteLote(id: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("lotes_piezas").delete().eq("id", id);

  if (error) {
    console.error("Error deleting lote:", error);
    throw error;
  }

  return true;
}

// =====================================================
// ITEMS OPERATIONS
// =====================================================

/**
 * Agrega un item al lote
 */
export async function addItemToLote(
  loteId: string,
  item: Omit<LotePiezasItem, "id" | "loteId" | "createdAt">
): Promise<LotePiezasItem> {
  const supabase = createAdminClient();

  const insertData = {
    lote_id: loteId,
    reparacion_id: item.reparacionId || null,
    descripcion: item.descripcion,
    cantidad_pedida: item.cantidadPedida,
    cantidad_recibida: item.cantidadRecibida || null,
    costo_unitario: item.costoUnitario || null,
    estado_item: item.estadoItem || "pendiente",
    notas: item.notas || null,
  };

  const { data, error } = await supabase
    .from("lotes_piezas_items")
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error("Error adding item to lote:", error);
    throw error;
  }

  return mapLotePiezasItemFromDB(data);
}

/**
 * Actualiza el estado de un item del lote
 */
export async function updateItemEstado(
  itemId: string,
  estadoItem: string,
  cantidadRecibida?: number,
  notas?: string
): Promise<LotePiezasItem> {
  const supabase = createAdminClient();

  const updateData: Record<string, any> = {
    estado_item: estadoItem,
  };

  if (cantidadRecibida !== undefined) {
    updateData.cantidad_recibida = cantidadRecibida;
  }

  if (notas !== undefined) {
    updateData.notas = notas;
  }

  const { data, error } = await supabase
    .from("lotes_piezas_items")
    .update(updateData)
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    console.error("Error updating item estado:", error);
    throw error;
  }

  return mapLotePiezasItemFromDB(data);
}

/**
 * Elimina un item del lote
 */
export async function deleteItemFromLote(itemId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("lotes_piezas_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error deleting item from lote:", error);
    throw error;
  }

  return true;
}

// =====================================================
// DISTRIBUCIÓN DE COSTO DE ENVÍO
// =====================================================

/**
 * Distribuye el costo de envío entre las reparaciones del lote
 * Calcula costo proporcional: (costo_envio_total / cantidad_items_reparaciones)
 */
export async function distribuirCostoEnvio(loteId: string): Promise<boolean> {
  const supabase = createAdminClient();

  // 1. Obtener el lote con sus items
  const lote = await getLoteById(loteId);
  if (!lote) throw new Error("Lote no encontrado");

  // 2. Obtener items que están vinculados a reparaciones
  const { data: items, error: errorItems } = await supabase
    .from("lotes_piezas_items")
    .select("id, reparacion_id")
    .eq("lote_id", loteId)
    .not("reparacion_id", "is", null);

  if (errorItems) {
    console.error("Error fetching lote items:", errorItems);
    throw errorItems;
  }

  const reparacionesIds = items.map((item: any) => item.reparacion_id);
  if (reparacionesIds.length === 0) {
    // Sin reparaciones vinculadas, nada que distribuir
    return true;
  }

  // 3. Obtener count de piezas por reparación en este lote
  const { data: piezasPorReparacion, error: errorPiezas } = await supabase
    .from("reparacion_piezas")
    .select("reparacion_id, id")
    .eq("lote_id", loteId);

  if (errorPiezas) {
    console.error("Error fetching repair pieces:", errorPiezas);
    throw errorPiezas;
  }

  if (piezasPorReparacion.length === 0) {
    return true; // Sin piezas de reparación, nada que distribuir
  }

  // 4. Calcular costo proporcional
  const costoEnvioTotal = lote.costoEnvioTotal || 0;
  const costoUnitario = costoEnvioTotal / piezasPorReparacion.length;

  // 5. Actualizar cada reparacion_pieza con su costo de envío proporcionado
  for (const pieza of piezasPorReparacion) {
    const { error: updateError } = await supabase
      .from("reparacion_piezas")
      .update({
        costo_envio_proporcionado: costoUnitario,
      })
      .eq("id", pieza.id);

    if (updateError) {
      console.error(`Error updating piece ${pieza.id}:`, updateError);
      throw updateError;
    }
  }

  // 6. Marcar lote como verificado
  await updateLote(loteId, { estado: "verificado" });

  return true;
}
