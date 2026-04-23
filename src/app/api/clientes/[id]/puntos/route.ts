/**
 * GET  /api/clientes/[id]/puntos  — saldo y historial del año actual
 * POST /api/clientes/[id]/puntos  — canjear puntos como descuento
 */

import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { getSaldoPuntos, getHistorialPuntos, canjearPuntos } from "@/lib/db/puntos";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const { id: clienteId } = await params;
    const distId = isSuperAdmin ? undefined : (distribuidorId ?? undefined);

    const [saldo, historial] = await Promise.all([
      getSaldoPuntos(clienteId, distId),
      getHistorialPuntos(clienteId, distId),
    ]);

    return NextResponse.json({ success: true, data: { saldo, historial } });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const permitidos = ["admin", "super_admin", "vendedor", "cobrador"];
    if (!permitidos.includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permisos" }, { status: 403 });
    }

    const { id: clienteId } = await params;
    const distId = isSuperAdmin ? undefined : (distribuidorId ?? undefined);

    const body = await request.json();
    const { puntos, referenciaId, referenciaTipo, descripcion } = body as {
      puntos: number;
      referenciaId: string;
      referenciaTipo: "reparacion" | "venta_pos";
      descripcion?: string;
    };

    if (!puntos || puntos <= 0) {
      return NextResponse.json({ success: false, error: "Puntos inválidos" }, { status: 400 });
    }
    if (!referenciaId || !referenciaTipo) {
      return NextResponse.json({ success: false, error: "Faltan referenciaId y referenciaTipo" }, { status: 400 });
    }

    const result = await canjearPuntos({
      clienteId,
      distribuidorId: distId,
      puntos,
      referenciaId,
      referenciaTipo,
      descripcion: descripcion ?? `Canje de ${puntos} puntos`,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        puntosCanjeados: result.puntosCanjeados,
        descuentoMXN:    result.descuentoMXN,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
