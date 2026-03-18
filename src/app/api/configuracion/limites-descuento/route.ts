import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { getLimitesDescuento, updateLimitesDescuento } from "@/lib/db/autorizaciones";

/**
 * GET /api/configuracion/limites-descuento
 * Obtiene los límites de descuento del distribuidor actual.
 * Acceso: admin, super_admin, vendedor (para saber sus propios límites).
 */
export async function GET() {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const filterDist =
      role === "super_admin" ? undefined : (distribuidorId ?? undefined);

    const limites = await getLimitesDescuento(filterDist);
    return NextResponse.json({ success: true, data: limites });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/configuracion/limites-descuento
 * Actualiza los límites de descuento.
 * Acceso: admin, super_admin.
 */
export async function PUT(request: Request) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { vendedorLibrePct, vendedorConRazonPct, permiteMontFijo, montoFijoMaximoSinAprobacion } =
      body;

    const filterDist =
      role === "super_admin" && body.distribuidorId
        ? body.distribuidorId
        : (distribuidorId ?? undefined);

    await updateLimitesDescuento(filterDist, {
      vendedorLibrePct: Number(vendedorLibrePct),
      vendedorConRazonPct: Number(vendedorConRazonPct),
      permiteMontFijo: Boolean(permiteMontFijo),
      montoFijoMaximoSinAprobacion: Number(montoFijoMaximoSinAprobacion),
    });

    const updated = await getLimitesDescuento(filterDist);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
