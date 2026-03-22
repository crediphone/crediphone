/**
 * FASE 56: Capa DB — Permisos Granulares por Empleado
 *
 * Gestiona la tabla `permisos_empleado` que almacena overrides explícitos
 * (concesiones o revocaciones) sobre los permisos default del rol.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { MapaPermisos } from "@/types";

// ─── Helpers internos ────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): { permiso: string; activo: boolean } {
  return {
    permiso: row.permiso as string,
    activo:  row.activo  as boolean,
  };
}

// ─── Consultas ───────────────────────────────────────────────────────────────

/**
 * Devuelve el mapa de permisos explícitos para un empleado.
 * { [permiso]: activo }
 */
export async function getPermisosEmpleado(usuarioId: string): Promise<MapaPermisos> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("permisos_empleado")
    .select("permiso, activo")
    .eq("usuario_id", usuarioId);

  if (error) {
    console.error("[permisos] getPermisosEmpleado error:", error.message);
    return {};
  }

  const mapa: MapaPermisos = {};
  for (const row of data ?? []) {
    mapa[mapRow(row as Record<string, unknown>).permiso] = mapRow(row as Record<string, unknown>).activo;
  }
  return mapa;
}

/**
 * Establece (upsert) un permiso explícito para un empleado.
 * Si activo=null o undefined se elimina el override (vuelve al default del rol).
 */
export async function setPermiso(
  usuarioId:    string,
  permiso:      string,
  activo:       boolean | null,
  otorgadoPor?: string,
): Promise<void> {
  const supabase = createAdminClient();

  if (activo === null || activo === undefined) {
    // Eliminar override → queda con el default del rol
    await supabase
      .from("permisos_empleado")
      .delete()
      .eq("usuario_id", usuarioId)
      .eq("permiso", permiso);
    return;
  }

  await supabase
    .from("permisos_empleado")
    .upsert(
      {
        usuario_id:    usuarioId,
        permiso,
        activo,
        otorgado_por:  otorgadoPor ?? null,
        updated_at:    new Date().toISOString(),
      },
      { onConflict: "usuario_id,permiso" },
    );
}

/**
 * Reemplaza TODOS los permisos explícitos de un empleado de una vez.
 * Elimina los registros no incluidos en el nuevo mapa.
 *
 * @param mapa — { [permiso]: activo } — solo los permisos que deben guardarse.
 *              Para limpiar todo, pasar {} y se borran todos los overrides.
 */
export async function setPermisosEmpleado(
  usuarioId:   string,
  mapa:        MapaPermisos,
  otorgadoPor?: string,
): Promise<void> {
  const supabase = createAdminClient();

  // 1. Borrar todos los registros actuales del empleado
  const { error: delError } = await supabase
    .from("permisos_empleado")
    .delete()
    .eq("usuario_id", usuarioId);

  if (delError) {
    console.error("[permisos] setPermisosEmpleado delete error:", delError.message);
    throw delError;
  }

  // 2. Insertar los nuevos (solo los que están en el mapa)
  const entries = Object.entries(mapa);
  if (entries.length === 0) return;

  const rows = entries.map(([permiso, activo]) => ({
    usuario_id:   usuarioId,
    permiso,
    activo,
    otorgado_por: otorgadoPor ?? null,
  }));

  const { error: insError } = await supabase
    .from("permisos_empleado")
    .insert(rows);

  if (insError) {
    console.error("[permisos] setPermisosEmpleado insert error:", insError.message);
    throw insError;
  }
}

/**
 * Elimina todos los permisos explícitos de un empleado.
 * (Lo deja con solo los defaults del rol.)
 */
export async function resetPermisosEmpleado(usuarioId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("permisos_empleado")
    .delete()
    .eq("usuario_id", usuarioId);
}
