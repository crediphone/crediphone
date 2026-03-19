/**
 * FASE 45 — Servicio de Plantillas de Notificación WhatsApp
 *
 * Carga plantillas de la tabla `plantillas_notificacion`.
 * Prioridad: plantilla del distribuidor > plantilla global (distribuidor_id = NULL).
 * Sustituye variables {nombre}, {monto}, {folio}, etc. en los mensajes.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────

export type CategoriaPlantilla = "credito" | "reparacion";

export interface Plantilla {
  id: string;
  distribuidorId: string | null;
  tipo: string;
  categoria: CategoriaPlantilla;
  nombre: string;
  descripcion: string | null;
  mensaje: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Variables disponibles para sustituir en plantillas de crédito */
export interface VarsCredito {
  nombre: string;           // Nombre del cliente
  folio: string;            // Folio del crédito
  monto: string;            // Monto del crédito formateado
  dias_mora: string;        // Días en mora
  monto_mora: string;       // Monto de mora formateado
  fecha_limite: string;     // Fecha del próximo pago
  monto_pago: string;       // Monto del pago recibido
  fecha_pago: string;       // Fecha del pago
  metodo_pago: string;      // Método de pago
  empresa: string;          // Nombre de la empresa
}

/** Variables disponibles para sustituir en plantillas de reparación */
export interface VarsReparacion {
  nombre: string;           // Nombre del cliente
  folio: string;            // Folio de la orden
  dispositivo: string;      // Marca + Modelo
  problema: string;         // Problema reportado
  diagnostico: string;      // Diagnóstico técnico
  costo_total: string;      // Costo total formateado
  saldo_pendiente: string;  // Saldo pendiente
  tecnico: string;          // Nombre del técnico
  tiempo_estimado: string;  // Fecha estimada de entrega
  link_tracking: string;    // URL de tracking del cliente
  fecha_hoy: string;        // Fecha actual formateada
  direccion_empresa: string;// Dirección de la tienda
  empresa: string;          // Nombre de la empresa
}

export type VarsPlantilla = Partial<VarsCredito & VarsReparacion>;

// ─────────────────────────────────────────────────────────────────
// MAPPER
// ─────────────────────────────────────────────────────────────────

function mapPlantilla(row: Record<string, unknown>): Plantilla {
  return {
    id:             row.id as string,
    distribuidorId: row.distribuidor_id as string | null,
    tipo:           row.tipo as string,
    categoria:      row.categoria as CategoriaPlantilla,
    nombre:         row.nombre as string,
    descripcion:    row.descripcion as string | null,
    mensaje:        row.mensaje as string,
    activa:         row.activa as boolean,
    createdAt:      row.created_at as string,
    updatedAt:      row.updated_at as string,
  };
}

// ─────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────

/**
 * Obtiene todas las plantillas visibles para un distribuidor.
 * Devuelve: plantillas propias del distribuidor + plantillas globales
 * donde no haya una propia del mismo tipo.
 */
export async function getPlantillasDistribuidor(
  distribuidorId: string | null
): Promise<Plantilla[]> {
  const supabase = createAdminClient();

  // Traemos tanto las globales como las del distribuidor en una sola query
  let query = supabase
    .from("plantillas_notificacion")
    .select("*")
    .order("categoria", { ascending: true })
    .order("nombre", { ascending: true });

  if (distribuidorId) {
    // Plantillas globales ORR las del distribuidor
    query = query.or(`distribuidor_id.is.null,distribuidor_id.eq.${distribuidorId}`);
  } else {
    // super_admin ve solo las globales
    query = query.is("distribuidor_id", null);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error al obtener plantillas:", error);
    return [];
  }

  const rows = (data ?? []) as Record<string, unknown>[];

  // Prioridad: plantilla propia del distribuidor > global
  const porTipo = new Map<string, Plantilla>();
  for (const row of rows) {
    const p = mapPlantilla(row);
    const existing = porTipo.get(p.tipo);
    // Si ya hay una global y ahora tenemos una del distribuidor, la reemplazamos
    if (!existing || (existing.distribuidorId === null && p.distribuidorId !== null)) {
      porTipo.set(p.tipo, p);
    }
  }

  return Array.from(porTipo.values());
}

/**
 * Obtiene una plantilla específica por tipo para un distribuidor.
 * Prioriza la plantilla propia del distribuidor sobre la global.
 */
export async function getPlantilla(
  tipo: string,
  distribuidorId: string | null
): Promise<Plantilla | null> {
  const supabase = createAdminClient();

  // Intentar plantilla propia primero
  if (distribuidorId) {
    const { data } = await supabase
      .from("plantillas_notificacion")
      .select("*")
      .eq("tipo", tipo)
      .eq("distribuidor_id", distribuidorId)
      .eq("activa", true)
      .maybeSingle();

    if (data) return mapPlantilla(data as Record<string, unknown>);
  }

  // Fallback a plantilla global
  const { data } = await supabase
    .from("plantillas_notificacion")
    .select("*")
    .eq("tipo", tipo)
    .is("distribuidor_id", null)
    .eq("activa", true)
    .maybeSingle();

  return data ? mapPlantilla(data as Record<string, unknown>) : null;
}

/**
 * Crea o actualiza una plantilla personalizada para un distribuidor.
 * Si el tipo ya existe para ese distribuidor, hace upsert.
 */
export async function upsertPlantilla(
  distribuidorId: string,
  tipo: string,
  fields: { nombre?: string; mensaje?: string; activa?: boolean }
): Promise<Plantilla | null> {
  const supabase = createAdminClient();

  // Buscar si ya existe una para ese distribuidor
  const { data: existing } = await supabase
    .from("plantillas_notificacion")
    .select("id, categoria, nombre, descripcion")
    .eq("tipo", tipo)
    .eq("distribuidor_id", distribuidorId)
    .maybeSingle();

  let result;
  if (existing) {
    // Update
    const { data, error } = await supabase
      .from("plantillas_notificacion")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", (existing as Record<string, unknown>).id as string)
      .select()
      .single();
    if (error) { console.error("Error al actualizar plantilla:", error); return null; }
    result = data;
  } else {
    // Buscar la plantilla global para copiar categoria/nombre/descripcion
    const { data: global } = await supabase
      .from("plantillas_notificacion")
      .select("categoria, nombre, descripcion, mensaje")
      .eq("tipo", tipo)
      .is("distribuidor_id", null)
      .maybeSingle();

    const g = global as Record<string, unknown> | null;

    const { data, error } = await supabase
      .from("plantillas_notificacion")
      .insert({
        distribuidor_id: distribuidorId,
        tipo,
        categoria:   g?.categoria ?? "credito",
        nombre:      fields.nombre   ?? g?.nombre   ?? tipo,
        descripcion: g?.descripcion  ?? null,
        mensaje:     fields.mensaje  ?? g?.mensaje   ?? "",
        activa:      fields.activa   ?? true,
      })
      .select()
      .single();
    if (error) { console.error("Error al crear plantilla:", error); return null; }
    result = data;
  }

  return result ? mapPlantilla(result as Record<string, unknown>) : null;
}

/**
 * Restaura la plantilla de un distribuidor a la global
 * (borra la personalizada del distribuidor para ese tipo).
 */
export async function restaurarPlantillaGlobal(
  distribuidorId: string,
  tipo: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("plantillas_notificacion")
    .delete()
    .eq("tipo", tipo)
    .eq("distribuidor_id", distribuidorId);

  if (error) {
    console.error("Error al restaurar plantilla global:", error);
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────
// SUSTITUCIÓN DE VARIABLES
// ─────────────────────────────────────────────────────────────────

/**
 * Sustituye las variables {clave} en un template de mensaje.
 * Variables no encontradas se dejan como vacías o con placeholder.
 */
export function renderMensaje(
  template: string,
  vars: VarsPlantilla
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key as keyof VarsPlantilla];
    return val !== undefined && val !== null ? String(val) : `{${key}}`;
  });
}

/**
 * Genera el link wa.me con el mensaje ya renderizado.
 */
export function generarWaLink(telefono: string, mensaje: string): string {
  const tel = telefono.replace(/\D/g, "");
  // Si empieza con 52 ya tiene código de país, si no lo agregamos
  const telFinal = tel.startsWith("52") ? tel : `52${tel}`;
  return `https://wa.me/${telFinal}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Lista de variables disponibles por categoría, para mostrar en el editor.
 */
export const VARIABLES_DISPONIBLES: Record<
  CategoriaPlantilla,
  Array<{ clave: string; descripcion: string }>
> = {
  credito: [
    { clave: "nombre",       descripcion: "Nombre del cliente" },
    { clave: "folio",        descripcion: "Folio del crédito" },
    { clave: "monto",        descripcion: "Monto del crédito" },
    { clave: "dias_mora",    descripcion: "Días en mora" },
    { clave: "monto_mora",   descripcion: "Cargo por mora acumulado" },
    { clave: "fecha_limite", descripcion: "Fecha límite del pago" },
    { clave: "monto_pago",   descripcion: "Monto del último pago" },
    { clave: "fecha_pago",   descripcion: "Fecha del último pago" },
    { clave: "metodo_pago",  descripcion: "Método de pago utilizado" },
    { clave: "empresa",      descripcion: "Nombre de tu empresa" },
  ],
  reparacion: [
    { clave: "nombre",           descripcion: "Nombre del cliente" },
    { clave: "folio",            descripcion: "Folio de la orden" },
    { clave: "dispositivo",      descripcion: "Marca y modelo del equipo" },
    { clave: "problema",         descripcion: "Problema reportado" },
    { clave: "diagnostico",      descripcion: "Diagnóstico del técnico" },
    { clave: "costo_total",      descripcion: "Costo total de la reparación" },
    { clave: "saldo_pendiente",  descripcion: "Saldo que debe pagar" },
    { clave: "tecnico",          descripcion: "Nombre del técnico asignado" },
    { clave: "tiempo_estimado",  descripcion: "Fecha estimada de entrega" },
    { clave: "link_tracking",    descripcion: "Link de seguimiento del cliente" },
    { clave: "fecha_hoy",        descripcion: "Fecha de hoy" },
    { clave: "direccion_empresa",descripcion: "Dirección de la sucursal" },
    { clave: "empresa",          descripcion: "Nombre de tu empresa" },
  ],
};
