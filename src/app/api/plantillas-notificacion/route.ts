/**
 * FASE 45 — API de Plantillas de Notificación WhatsApp
 *
 * GET  → lista todas las plantillas del distribuidor (propias + globales)
 * PUT  → crea/actualiza plantilla personalizada para el distribuidor
 * DELETE → restaura plantilla a la versión global (borra la personalizada)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import {
  getPlantillasDistribuidor,
  upsertPlantilla,
  restaurarPlantillaGlobal,
} from "@/lib/plantillas-notificacion";

// GET /api/plantillas-notificacion
export async function GET() {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const distId = role === "super_admin" ? null : (distribuidorId ?? null);
    const plantillas = await getPlantillasDistribuidor(distId);

    return NextResponse.json({ success: true, data: plantillas });
  } catch (error) {
    console.error("Error en GET /api/plantillas-notificacion:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// PUT /api/plantillas-notificacion
// Body: { tipo, mensaje, nombre?, activa? }
export async function PUT(req: NextRequest) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permisos" }, { status: 403 });
    }

    const body = await req.json();
    const { tipo, mensaje, nombre, activa } = body;

    if (!tipo || !mensaje) {
      return NextResponse.json(
        { success: false, error: "tipo y mensaje son requeridos" },
        { status: 400 }
      );
    }

    // super_admin puede pasar un distribuidor_id específico; admin usa el suyo
    const targetDistId: string | null =
      role === "super_admin"
        ? (body.distribuidor_id ?? distribuidorId ?? null)
        : (distribuidorId ?? null);

    if (!targetDistId) {
      return NextResponse.json(
        { success: false, error: "No se puede determinar el distribuidor" },
        { status: 400 }
      );
    }

    const plantilla = await upsertPlantilla(targetDistId, tipo, {
      mensaje,
      nombre,
      activa,
    });

    if (!plantilla) {
      return NextResponse.json({ success: false, error: "No se pudo guardar la plantilla" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: plantilla });
  } catch (error) {
    console.error("Error en PUT /api/plantillas-notificacion:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// DELETE /api/plantillas-notificacion?tipo=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permisos" }, { status: 403 });
    }

    const tipo = req.nextUrl.searchParams.get("tipo");
    if (!tipo) {
      return NextResponse.json({ success: false, error: "Falta tipo" }, { status: 400 });
    }

    const targetDistId = role === "super_admin"
      ? (req.nextUrl.searchParams.get("distribuidor_id") ?? distribuidorId ?? null)
      : (distribuidorId ?? null);

    if (!targetDistId) {
      return NextResponse.json({ success: false, error: "No se puede determinar el distribuidor" }, { status: 400 });
    }

    const ok = await restaurarPlantillaGlobal(targetDistId, tipo);

    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error("Error en DELETE /api/plantillas-notificacion:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
