import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addAnticipoReparacion,
  getAnticiposByOrden,
} from "@/lib/db/reparaciones";
import { getSesionActiva } from "@/lib/db/caja";
import { createTraspasoAnticipo } from "@/lib/db/traspasos";
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
 *
 * FASE 37 — Flujo diferenciado por rol:
 *
 * Si quien registra es un TÉCNICO y el método es EFECTIVO:
 *   → Se crea el anticipo en anticipos_reparacion (para actualizar el saldo)
 *   → Se crea un traspaso_anticipo en estado 'pendiente' (el vendedor deberá confirmar)
 *   → NO se asienta en caja todavía — la caja recibe el monto cuando el vendedor confirma
 *
 * En todos los demás casos (vendedor/admin, o pago no en efectivo):
 *   → Flujo original: anticipo + caja directamente
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
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

    const supabase = createAdminClient();

    // Obtener datos de la orden (folio + cliente)
    const { data: orden } = await supabase
      .from("ordenes_reparacion")
      .select("folio, cliente:clientes(nombre, apellido)")
      .eq("id", id)
      .single();

    // FASE 37: Técnico + efectivo → traspaso pendiente (no va a caja directamente)
    const esTecnicoConEfectivo = role === "tecnico" && body.tipoPago === "efectivo";

    // Sesión de caja (solo se usa cuando NO es traspaso)
    let sesionCajaId: string | undefined;
    if (!esTecnicoConEfectivo) {
      try {
        const sesion = await getSesionActiva(userId);
        sesionCajaId = sesion?.id;
      } catch {
        // Sin sesión activa — el anticipo se registra igual, solo sin caja
      }
    }

    // Crear el anticipo en anticipos_reparacion
    // Si es traspaso: NO pasa sesionCajaId (para que NO asiente en caja)
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
      esTecnicoConEfectivo ? undefined : sesionCajaId, // Sin caja si es traspaso
      orden?.folio
    );

    // FASE 37: Crear el traspaso pendiente
    if (esTecnicoConEfectivo) {
      const clienteData = orden?.cliente as { nombre?: string; apellido?: string } | null;
      const clienteNombre = clienteData
        ? [clienteData.nombre, clienteData.apellido].filter(Boolean).join(" ")
        : "Cliente";

      await createTraspasoAnticipo({
        distribuidorId: distribuidorId ?? undefined,
        reparacionId: id,
        anticipoId: anticipo.id,
        tecnicoId: userId,
        folioOrden: orden?.folio || "Sin folio",
        clienteNombre,
        montoRegistrado: Number(body.monto),
      });

      return NextResponse.json({
        success: true,
        data: anticipo,
        message: "Anticipo registrado. El vendedor debe confirmar la recepción del efectivo.",
        requiereTraspaso: true,
        registradoEnCaja: false,
      });
    }

    return NextResponse.json({
      success: true,
      data: anticipo,
      message: "Anticipo registrado" + (sesionCajaId ? " y asentado en caja" : " (sin sesión de caja activa)"),
      requiereTraspaso: false,
      registradoEnCaja: !!sesionCajaId,
    });
  } catch (error) {
    console.error("Error en POST /api/reparaciones/[id]/anticipos:", error);
    return NextResponse.json({ success: false, error: "Error al registrar anticipo", message: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 });
  }
}
