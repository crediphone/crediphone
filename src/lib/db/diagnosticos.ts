/**
 * FASE 56: Funciones de BD para múltiples diagnósticos por orden de reparación.
 * Permite registrar nuevos problemas encontrados durante la reparación sin perder
 * el historial del diagnóstico inicial.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ReparacionDiagnostico,
  CrearDiagnosticoPayload,
  AprobarDiagnosticoPayload,
} from "@/types";

// ─── Mapper DB → TypeScript ────────────────────────────────────────────────

function mapDiagnosticoFromDB(db: any): ReparacionDiagnostico {
  return {
    id: db.id,
    ordenId: db.orden_id,
    numeroDiagnostico: db.numero_diagnostico,
    tecnicoId: db.tecnico_id ?? undefined,
    tecnicoNombre: db.tecnico?.nombre
      ? `${db.tecnico.nombre} ${db.tecnico.apellido_paterno ?? ""}`.trim()
      : undefined,
    descripcionProblema: db.descripcion_problema,
    diagnosticoTecnico: db.diagnostico_tecnico ?? undefined,
    costoLabor: parseFloat(db.costo_labor ?? "0"),
    costoPartes: parseFloat(db.costo_partes ?? "0"),
    partesNecesarias: db.partes_necesarias ?? [],
    estado: db.estado,
    aprobadoPorCliente: db.aprobado_por_cliente ?? false,
    fechaAprobacion: db.fecha_aprobacion ?? undefined,
    tipoAprobacion: db.tipo_aprobacion ?? undefined,
    aprobadoPorEmpleadoId: db.aprobado_por_empleado_id ?? undefined,
    notas: db.notas ?? undefined,
    esDiagnosticoInicial: db.es_diagnostico_inicial ?? false,
    distribuidorId: db.distribuidor_id ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ─── GET: obtener todos los diagnósticos de una orden ────────────────────────

export async function getDiagnosticosByOrden(
  ordenId: string
): Promise<ReparacionDiagnostico[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reparacion_diagnosticos")
    .select(`
      *,
      tecnico:users!tecnico_id(nombre, apellido_paterno)
    `)
    .eq("orden_id", ordenId)
    .order("numero_diagnostico", { ascending: true });

  if (error) throw new Error(`Error al obtener diagnósticos: ${error.message}`);
  return (data || []).map(mapDiagnosticoFromDB);
}

// ─── POST: crear un nuevo diagnóstico (número 2+, "nuevo problema") ──────────

export async function crearSegundoDiagnostico(
  payload: CrearDiagnosticoPayload,
  tecnicoId: string,
  distribuidorId: string | undefined
): Promise<ReparacionDiagnostico> {
  const supabase = createAdminClient();

  // Determinar el siguiente número
  const { data: existing, error: countErr } = await supabase
    .from("reparacion_diagnosticos")
    .select("numero_diagnostico")
    .eq("orden_id", payload.ordenId)
    .order("numero_diagnostico", { ascending: false })
    .limit(1);

  if (countErr) throw new Error(`Error al consultar diagnósticos: ${countErr.message}`);
  const siguienteNumero = ((existing?.[0]?.numero_diagnostico) ?? 0) + 1;

  const { data, error } = await supabase
    .from("reparacion_diagnosticos")
    .insert({
      orden_id: payload.ordenId,
      numero_diagnostico: siguienteNumero,
      tecnico_id: tecnicoId,
      descripcion_problema: payload.descripcionProblema,
      diagnostico_tecnico: payload.diagnosticoTecnico ?? null,
      costo_labor: payload.costoLabor ?? 0,
      costo_partes: payload.costoPartes ?? 0,
      partes_necesarias: payload.partesNecesarias ?? [],
      notas: payload.notas ?? null,
      estado: "pendiente_aprobacion",
      aprobado_por_cliente: false,
      es_diagnostico_inicial: siguienteNumero === 1,
      distribuidor_id: distribuidorId ?? null,
    })
    .select(`*, tecnico:users!tecnico_id(nombre, apellido_paterno)`)
    .single();

  if (error) throw new Error(`Error al crear diagnóstico: ${error.message}`);
  return mapDiagnosticoFromDB(data);
}

// ─── PATCH: registrar decisión del cliente (aprobar / rechazar / cancelar todo)

export async function aprobarDiagnostico(
  diagnosticoId: string,
  payload: AprobarDiagnosticoPayload,
  empleadoId: string
): Promise<ReparacionDiagnostico> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reparacion_diagnosticos")
    .update({
      estado: payload.estado,
      aprobado_por_cliente: payload.estado === "aprobado",
      fecha_aprobacion: new Date().toISOString(),
      tipo_aprobacion: payload.tipoAprobacion,
      aprobado_por_empleado_id: empleadoId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", diagnosticoId)
    .select(`*, tecnico:users!tecnico_id(nombre, apellido_paterno)`)
    .single();

  if (error) throw new Error(`Error al actualizar diagnóstico: ${error.message}`);
  return mapDiagnosticoFromDB(data);
}

// ─── GET: diagnóstico pendiente de aprobación para una orden ─────────────────

export async function getDiagnosticoPendiente(
  ordenId: string
): Promise<ReparacionDiagnostico | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reparacion_diagnosticos")
    .select(`*, tecnico:users!tecnico_id(nombre, apellido_paterno)`)
    .eq("orden_id", ordenId)
    .eq("estado", "pendiente_aprobacion")
    .order("numero_diagnostico", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Error: ${error.message}`);
  return data ? mapDiagnosticoFromDB(data) : null;
}
