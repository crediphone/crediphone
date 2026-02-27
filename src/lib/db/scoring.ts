import { supabaseServer as supabase } from "@/lib/supabase-server";

export interface ScoringData {
  id: string;
  cliente_id: string;
  puntaje_total: number;
  puntaje_historial_pagos: number;
  puntaje_antiguedad: number;
  puntaje_referencias: number;
  puntaje_capacidad_pago: number;
  puntaje_documentacion: number;
  nivel_riesgo: "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO" | "SIN_EVALUAR";
  limite_credito_sugerido: number;
  enganche_minimo_sugerido: number;
  tasa_interes_sugerida: number;
  plazo_maximo_sugerido: number;
  ultima_evaluacion: string;
}

/**
 * Obtiene el scoring de un cliente
 */
export async function getScoringByClienteId(clienteId: string): Promise<ScoringData | null> {
  const { data, error } = await supabase
    .from("scoring_clientes")
    .select("*")
    .eq("cliente_id", clienteId)
    .single();

  if (error) {
    console.error("Error al obtener scoring:", error);
    return null;
  }

  return data;
}

/**
 * Calcula el scoring de un cliente usando la función de PostgreSQL
 */
export async function calcularScoringCliente(clienteId: string): Promise<ScoringData | null> {
  try {
    console.log(`[scoring] Calculando scoring para cliente: ${clienteId}`);

    // Llamar a la función RPC de PostgreSQL
    const { data, error } = await supabase
      .rpc("calcular_scoring_cliente", { cliente_uuid: clienteId });

    if (error) {
      console.error("[scoring] Error RPC:", error);
      throw error;
    }

    console.log("[scoring] Resultado RPC:", data);

    if (!data || data.length === 0) {
      console.log("[scoring] No hay datos, retornando null");
      return null;
    }

    const resultado = data[0];

    // Insertar o actualizar en la tabla scoring_clientes
    const scoringRecord = {
      cliente_id: clienteId,
      puntaje_total: resultado.puntaje_total || 0,
      puntaje_historial_pagos: resultado.puntaje_historial || 0,
      puntaje_antiguedad: resultado.puntaje_antiguedad || 0,
      puntaje_referencias: resultado.puntaje_referencias || 0,
      puntaje_capacidad_pago: resultado.puntaje_capacidad || 0,
      puntaje_documentacion: resultado.puntaje_documentacion || 0,
      nivel_riesgo: resultado.nivel_riesgo || 'SIN_EVALUAR',
      limite_credito_sugerido: resultado.limite_sugerido || 0,
      enganche_minimo_sugerido: resultado.enganche_sugerido || 20,
      tasa_interes_sugerida: resultado.tasa_sugerida || 25.00,
      plazo_maximo_sugerido: resultado.plazo_sugerido || 12,
      ultima_evaluacion: new Date().toISOString(),
    };

    console.log("[scoring] Guardando scoring:", scoringRecord);

    const { data: scoringData, error: upsertError } = await supabase
      .from("scoring_clientes")
      .upsert(scoringRecord)
      .select()
      .single();

    if (upsertError) {
      console.error("[scoring] Error al guardar scoring:", upsertError);
      throw upsertError;
    }

    console.log("[scoring] Scoring guardado exitosamente:", scoringData);
    return scoringData;
  } catch (error) {
    console.error("Error en calcularScoringCliente:", error);
    throw error;
  }
}

/**
 * Obtiene el scoring de un cliente, calculándolo si no existe
 */
export async function getOrCalculateScoring(clienteId: string): Promise<ScoringData | null> {
  try {
    console.log(`[scoring] getOrCalculateScoring para cliente: ${clienteId}`);

    // Intentar obtener scoring existente
    let scoring = await getScoringByClienteId(clienteId);

    if (scoring) {
      console.log("[scoring] Scoring existente encontrado");
      return scoring;
    }

    // Si no existe, calcularlo
    console.log("[scoring] Scoring no existe, calculando...");
    scoring = await calcularScoringCliente(clienteId);

    if (!scoring) {
      console.error("[scoring] No se pudo calcular el scoring");
    }

    return scoring;
  } catch (error) {
    console.error("[scoring] Error en getOrCalculateScoring:", error);
    throw error;
  }
}

/**
 * Recalcula el scoring de un cliente forzosamente
 */
export async function recalcularScoring(clienteId: string): Promise<ScoringData | null> {
  return await calcularScoringCliente(clienteId);
}
