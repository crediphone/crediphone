import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SolicitudAutorizacion,
  EstadoAutorizacion,
  LimitesDescuento,
  ItemContextoVenta,
} from "@/types";
import { randomBytes } from "crypto";

// ── Defaults ────────────────────────────────────────────────────────────────

export const LIMITES_DEFAULT: LimitesDescuento = {
  vendedorLibrePct: 5,
  vendedorConRazonPct: 15,
  permiteMontFijo: true,
  montoFijoMaximoSinAprobacion: 500,
};

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapFromDB(db: any): SolicitudAutorizacion {
  return {
    id: db.id,
    distribuidorId: db.distribuidor_id,
    empleadoId: db.empleado_id,
    empleadoNombre: db.empleado_nombre,
    autorizadorId: db.autorizador_id,
    autorizadorNombre: db.autorizador_nombre,
    tipo: db.tipo,
    montoVenta: Number(db.monto_venta),
    montoDescuento: Number(db.monto_descuento),
    porcentajeCalculado: Number(db.porcentaje_calculado),
    esMontFijo: db.es_monto_fijo,
    razon: db.razon,
    contexto: db.contexto,
    estado: db.estado as EstadoAutorizacion,
    respondidoAt: db.respondido_at ? new Date(db.respondido_at) : undefined,
    comentarioAutorizador: db.comentario_autorizador,
    linkToken: db.link_token,
    expiresAt: new Date(db.expires_at),
    createdAt: new Date(db.created_at),
  };
}

function mapLimites(raw: any): LimitesDescuento {
  if (!raw) return LIMITES_DEFAULT;
  return {
    vendedorLibrePct: raw.vendedor_libre_pct ?? LIMITES_DEFAULT.vendedorLibrePct,
    vendedorConRazonPct: raw.vendedor_con_razon_pct ?? LIMITES_DEFAULT.vendedorConRazonPct,
    permiteMontFijo: raw.permite_monto_fijo ?? LIMITES_DEFAULT.permiteMontFijo,
    montoFijoMaximoSinAprobacion:
      raw.monto_fijo_maximo_sin_aprobacion ?? LIMITES_DEFAULT.montoFijoMaximoSinAprobacion,
  };
}

// ── Limites ─────────────────────────────────────────────────────────────────

export async function getLimitesDescuento(distribuidorId?: string): Promise<LimitesDescuento> {
  const supabase = createAdminClient();
  let q = supabase.from("configuracion").select("limites_descuento");
  if (distribuidorId) {
    q = q.eq("distribuidor_id", distribuidorId);
  } else {
    q = q.is("distribuidor_id", null);
  }
  const { data } = await q.single();
  return mapLimites(data?.limites_descuento);
}

export async function updateLimitesDescuento(
  distribuidorId: string | undefined,
  limites: LimitesDescuento
): Promise<void> {
  const supabase = createAdminClient();
  const raw = {
    vendedor_libre_pct: limites.vendedorLibrePct,
    vendedor_con_razon_pct: limites.vendedorConRazonPct,
    permite_monto_fijo: limites.permiteMontFijo,
    monto_fijo_maximo_sin_aprobacion: limites.montoFijoMaximoSinAprobacion,
  };
  let q = supabase.from("configuracion").update({ limites_descuento: raw });
  if (distribuidorId) {
    q = q.eq("distribuidor_id", distribuidorId);
  } else {
    q = q.is("distribuidor_id", null);
  }
  const { error } = await q;
  if (error) throw new Error(error.message);
}

// ── Crear solicitud ─────────────────────────────────────────────────────────

export async function crearSolicitudAutorizacion(params: {
  distribuidorId?: string;
  empleadoId: string;
  empleadoNombre: string;
  montoVenta: number;
  montoDescuento: number;
  porcentajeCalculado: number;
  esMontFijo: boolean;
  razon?: string;
  contexto?: { items: ItemContextoVenta[]; subtotal: number };
}): Promise<SolicitudAutorizacion> {
  const supabase = createAdminClient();

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

  const { data, error } = await supabase
    .from("log_autorizaciones")
    .insert({
      distribuidor_id: params.distribuidorId ?? null,
      empleado_id: params.empleadoId,
      empleado_nombre: params.empleadoNombre,
      tipo: "descuento",
      monto_venta: params.montoVenta,
      monto_descuento: params.montoDescuento,
      porcentaje_calculado: params.porcentajeCalculado,
      es_monto_fijo: params.esMontFijo,
      razon: params.razon ?? null,
      contexto: params.contexto ?? null,
      estado: "pendiente",
      link_token: token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapFromDB(data);
}

// ── Leer solicitud ──────────────────────────────────────────────────────────

export async function getSolicitudById(id: string): Promise<SolicitudAutorizacion | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("log_autorizaciones")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapFromDB(data);
}

export async function getSolicitudByToken(token: string): Promise<SolicitudAutorizacion | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("log_autorizaciones")
    .select("*")
    .eq("link_token", token)
    .single();
  if (error) return null;
  return mapFromDB(data);
}

export async function getSolicitudesPendientes(
  distribuidorId?: string
): Promise<SolicitudAutorizacion[]> {
  const supabase = createAdminClient();

  // Primero expirar las que ya vencieron
  await supabase
    .from("log_autorizaciones")
    .update({ estado: "expirado", updated_at: new Date().toISOString() })
    .eq("estado", "pendiente")
    .lt("expires_at", new Date().toISOString());

  let q = supabase
    .from("log_autorizaciones")
    .select("*")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  if (distribuidorId) q = q.eq("distribuidor_id", distribuidorId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapFromDB);
}

export async function countSolicitudesPendientes(distribuidorId?: string): Promise<number> {
  const supabase = createAdminClient();
  let q = supabase
    .from("log_autorizaciones")
    .select("id", { count: "exact", head: true })
    .eq("estado", "pendiente")
    .gt("expires_at", new Date().toISOString());
  if (distribuidorId) q = q.eq("distribuidor_id", distribuidorId);
  const { count } = await q;
  return count ?? 0;
}

// ── Aprobar / declinar ──────────────────────────────────────────────────────

export async function aprobarSolicitud(
  id: string,
  autorizadorId: string,
  autorizadorNombre: string,
  comentario?: string
): Promise<SolicitudAutorizacion> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("log_autorizaciones")
    .update({
      estado: "aprobado",
      autorizador_id: autorizadorId,
      autorizador_nombre: autorizadorNombre,
      comentario_autorizador: comentario ?? null,
      respondido_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("estado", "pendiente") // solo si sigue pendiente
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapFromDB(data);
}

export async function declinarSolicitud(
  id: string,
  autorizadorId: string,
  autorizadorNombre: string,
  comentario: string
): Promise<SolicitudAutorizacion> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("log_autorizaciones")
    .update({
      estado: "declinado",
      autorizador_id: autorizadorId,
      autorizador_nombre: autorizadorNombre,
      comentario_autorizador: comentario,
      respondido_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("estado", "pendiente")
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapFromDB(data);
}
