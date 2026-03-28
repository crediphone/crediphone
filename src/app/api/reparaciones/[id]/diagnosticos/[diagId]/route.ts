/**
 * FASE 56: Aprobar / rechazar / cancelar un diagnóstico específico.
 * PATCH — registra la decisión del cliente (presencial, WA, teléfono)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { aprobarDiagnostico } from "@/lib/db/diagnosticos";
import type { AprobarDiagnosticoPayload } from "@/types";

// PATCH /api/reparaciones/[id]/diagnosticos/[diagId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; diagId: string }> }
) {
  try {
    const { diagId } = await params;
    const { userId, role } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const ALLOWED = ["admin", "tecnico", "super_admin"];
    if (!ALLOWED.includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
    }

    const body = await req.json();
    const { estado, tipoAprobacion } = body;

    if (!estado || !["aprobado", "rechazado", "cancelado_todo"].includes(estado)) {
      return NextResponse.json({ success: false, error: "Estado inválido" }, { status: 400 });
    }
    if (!tipoAprobacion || !["presencial", "whatsapp", "telefono"].includes(tipoAprobacion)) {
      return NextResponse.json({ success: false, error: "Tipo de aprobación inválido" }, { status: 400 });
    }

    const payload: AprobarDiagnosticoPayload = { estado, tipoAprobacion };
    const diagnostico = await aprobarDiagnostico(diagId, payload, userId);
    return NextResponse.json({ success: true, data: diagnostico });
  } catch (error) {
    console.error("[diagnosticos PATCH]", error);
    return NextResponse.json({ success: false, error: "Error al actualizar diagnóstico" }, { status: 500 });
  }
}
