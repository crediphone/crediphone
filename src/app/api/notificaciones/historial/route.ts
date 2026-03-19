/**
 * FASE 45 — API de Historial de Notificaciones WhatsApp
 *
 * POST → registra un envío de WhatsApp (el front abre wa.me, nosotros lo logueamos)
 * GET  → obtiene historial de notificaciones del distribuidor
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/notificaciones/historial
export async function POST(req: NextRequest) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { tipo, telefono, mensaje, canal = "whatsapp", creditoId, ordenId } = body;

    if (!tipo || !telefono || !mensaje) {
      return NextResponse.json(
        { success: false, error: "tipo, telefono y mensaje son requeridos" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const distId = role === "super_admin" ? (body.distribuidor_id ?? null) : (distribuidorId ?? null);

    const { data, error } = await supabase
      .from("notificaciones")
      .insert({
        distribuidor_id:       distId,
        tipo,
        canal,
        estado:                "enviado",
        mensaje,
        telefono,
        credito_id:            creditoId ?? null,
        orden_reparacion_id:   ordenId   ?? null,
        enviado_por:           userId,
        fecha_enviado:         new Date().toISOString(),
        datos_adicionales: {
          origen: "manual_whatsapp",
          fecha_accion: new Date().toISOString(),
        },
      })
      .select("id")
      .single();

    if (error) {
      // No es crítico — el mensaje ya fue abierto en WhatsApp
      console.warn("Error al registrar historial (no bloqueante):", error.message);
      return NextResponse.json({ success: true, data: null, warning: "No se pudo registrar en historial" });
    }

    return NextResponse.json({ success: true, data: { id: (data as { id: string }).id } });
  } catch (error) {
    console.error("Error en POST /api/notificaciones/historial:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// GET /api/notificaciones/historial?tipo=credito|reparacion&limite=20
export async function GET(req: NextRequest) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const tipo   = params.get("tipo");       // 'credito' | 'reparacion' | null (todos)
    const limite = parseInt(params.get("limite") ?? "30", 10);
    const creditoId = params.get("creditoId");
    const ordenId   = params.get("ordenId");

    const supabase = createAdminClient();

    let query = supabase
      .from("notificaciones")
      .select("id, tipo, canal, estado, mensaje, telefono, credito_id, orden_reparacion_id, enviado_por, fecha_enviado, datos_adicionales, created_at")
      .eq("canal", "whatsapp")
      .order("created_at", { ascending: false })
      .limit(limite);

    // Filtro por distribuidor
    if (role !== "super_admin" && distribuidorId) {
      query = query.eq("distribuidor_id", distribuidorId);
    }

    // Filtros opcionales
    if (tipo === "credito") {
      query = query.not("credito_id", "is", null);
    } else if (tipo === "reparacion") {
      query = query.not("orden_reparacion_id", "is", null);
    }

    if (creditoId) query = query.eq("credito_id", creditoId);
    if (ordenId)   query = query.eq("orden_reparacion_id", ordenId);

    const { data, error } = await query;

    if (error) {
      console.error("Error al obtener historial:", error);
      return NextResponse.json({ success: false, error: "Error al obtener historial" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("Error en GET /api/notificaciones/historial:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
