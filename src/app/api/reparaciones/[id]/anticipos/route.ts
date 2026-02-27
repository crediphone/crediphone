import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addAnticipoReparacion,
  getAnticiposByOrden,
} from "@/lib/db/reparaciones";
import { getSesionActiva } from "@/lib/db/caja";
import type { TipoPago, DesglosePagoMixto } from "@/types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/reparaciones/[id]/anticipos
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const anticipos = await getAnticiposByOrden(id);
    return NextResponse.json({ success: true, data: anticipos });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al obtener anticipos", message: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 });
  }
}

/**
 * POST /api/reparaciones/[id]/anticipos
 * Agrega anticipo y lo registra en la caja activa del usuario.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const { id } = await params;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();

    if (!body.monto || body.monto <= 0) {
      return NextResponse.json({ success: false, error: "El monto debe ser mayor a 0" }, { status: 400 });
    }
    if (!body.tipoPago) {
      return NextResponse.json({ success: false, error: "Tipo de pago requerido" }, { status: 400 });
    }

    // Obtener folio de la orden para el concepto en caja
    const supabase = createAdminClient();
    const { data: orden } = await supabase
      .from("ordenes_reparacion")
      .select("folio")
      .eq("id", id)
      .single();

    // Buscar sesión activa de caja del usuario
    let sesionCajaId: string | undefined;
    try {
      const sesion = await getSesionActiva(userId);
      sesionCajaId = sesion?.id;
    } catch {
      // Sin sesión de caja activa — el anticipo se registra igual, solo sin caja
    }

    const anticipo = await addAnticipoReparacion(
      id,
      {
        monto: Number(body.monto),
        tipoPago: body.tipoPago as TipoPago,
        desgloseMixto: body.desgloseMixto as DesglosePagoMixto | undefined,
        referenciaPago: body.referenciaPago,
        notas: body.notas,
      },
      userId,
      sesionCajaId,
      orden?.folio
    );

    return NextResponse.json({
      success: true,
      data: anticipo,
      message: "Anticipo registrado" + (sesionCajaId ? " y asentado en caja" : " (sin sesión de caja activa)"),
      registradoEnCaja: !!sesionCajaId,
    });
  } catch (error) {
    console.error("Error en POST /api/reparaciones/[id]/anticipos:", error);
    return NextResponse.json({ success: false, error: "Error al registrar anticipo", message: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 });
  }
}
