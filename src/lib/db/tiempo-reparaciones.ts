import { createAdminClient } from "@/lib/supabase/admin";
import type { TiempoLog, TiempoResumen } from "@/types";

function mapTiempoLogFromDB(db: any): TiempoLog {
  return {
    id: db.id,
    ordenId: db.orden_id,
    tecnicoId: db.tecnico_id,
    tecnicoNombre: db.users?.name ?? undefined,
    distribuidorId: db.distribuidor_id ?? undefined,
    inicioTrabajo: new Date(db.inicio_trabajo),
    finTrabajo: db.fin_trabajo ? new Date(db.fin_trabajo) : undefined,
    duracionMinutos: db.duracion_minutos ?? undefined,
    notas: db.notas ?? undefined,
    createdAt: new Date(db.created_at),
  };
}

/** Retorna todas las sesiones de una orden, incluyendo la activa si la hay */
export async function getTiempoLogs(ordenId: string): Promise<TiempoResumen> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reparacion_tiempo_logs")
    .select("*, users(name)")
    .eq("orden_id", ordenId)
    .order("inicio_trabajo", { ascending: false });

  if (error) throw new Error(error.message);

  const logs = (data ?? []).map(mapTiempoLogFromDB);
  const sesionActiva = logs.find((l) => !l.finTrabajo);
  const totalMinutos = logs
    .filter((l) => l.duracionMinutos !== undefined)
    .reduce((sum, l) => sum + (l.duracionMinutos ?? 0), 0);

  return {
    totalMinutos,
    totalSesiones: logs.filter((l) => l.finTrabajo !== undefined).length,
    sesionActiva,
    logs,
  };
}

/** Verifica si el técnico tiene una sesión activa en CUALQUIER orden */
export async function getSesionActivaTecnico(
  tecnicoId: string
): Promise<TiempoLog | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reparacion_tiempo_logs")
    .select("*, users(name)")
    .eq("tecnico_id", tecnicoId)
    .is("fin_trabajo", null)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapTiempoLogFromDB(data) : null;
}

/** Inicia una nueva sesión de trabajo en la orden. Falla si el técnico ya tiene una activa. */
export async function iniciarSesion(
  ordenId: string,
  tecnicoId: string,
  distribuidorId: string | null,
  notas?: string
): Promise<TiempoLog> {
  const supabase = createAdminClient();

  // Verificar que no haya sesión activa del técnico
  const activa = await getSesionActivaTecnico(tecnicoId);
  if (activa) {
    throw new Error(
      `Ya tienes una sesión activa en otra orden (${activa.ordenId}). Finalízala primero.`
    );
  }

  const { data, error } = await supabase
    .from("reparacion_tiempo_logs")
    .insert({
      orden_id: ordenId,
      tecnico_id: tecnicoId,
      distribuidor_id: distribuidorId,
      notas: notas ?? null,
    })
    .select("*, users(name)")
    .single();

  if (error) throw new Error(error.message);
  return mapTiempoLogFromDB(data);
}

/** Finaliza la sesión activa del técnico en la orden especificada. */
export async function finalizarSesion(
  ordenId: string,
  tecnicoId: string,
  notas?: string
): Promise<TiempoLog> {
  const supabase = createAdminClient();

  // Buscar sesión activa en esta orden
  const { data: sesion, error: fetchError } = await supabase
    .from("reparacion_tiempo_logs")
    .select("*")
    .eq("orden_id", ordenId)
    .eq("tecnico_id", tecnicoId)
    .is("fin_trabajo", null)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!sesion) throw new Error("No hay sesión activa en esta orden.");

  const ahora = new Date();
  const inicio = new Date(sesion.inicio_trabajo);
  const duracionMinutos = Math.round(
    (ahora.getTime() - inicio.getTime()) / 60000
  );

  const { data, error } = await supabase
    .from("reparacion_tiempo_logs")
    .update({
      fin_trabajo: ahora.toISOString(),
      duracion_minutos: duracionMinutos,
      notas: notas ?? sesion.notas,
    })
    .eq("id", sesion.id)
    .select("*, users(name)")
    .single();

  if (error) throw new Error(error.message);
  return mapTiempoLogFromDB(data);
}

/** Cancela (elimina) la sesión activa sin registrar tiempo. Solo admin/super_admin. */
export async function cancelarSesionActiva(
  ordenId: string,
  tecnicoId: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("reparacion_tiempo_logs")
    .delete()
    .eq("orden_id", ordenId)
    .eq("tecnico_id", tecnicoId)
    .is("fin_trabajo", null);

  if (error) throw new Error(error.message);
}
