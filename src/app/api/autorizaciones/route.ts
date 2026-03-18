import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import {
  crearSolicitudAutorizacion,
  getSolicitudesPendientes,
  countSolicitudesPendientes,
} from "@/lib/db/autorizaciones";

/**
 * GET /api/autorizaciones
 * Lista solicitudes pendientes (admin/super_admin).
 * ?count=true → solo devuelve el número de pendientes.
 */
export async function GET(request: Request) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const onlyCount = searchParams.get("count") === "true";

    const filterDist =
      role === "super_admin" ? undefined : (distribuidorId ?? undefined);

    if (onlyCount) {
      const count = await countSolicitudesPendientes(filterDist);
      return NextResponse.json({ success: true, count });
    }

    const solicitudes = await getSolicitudesPendientes(filterDist);
    return NextResponse.json({ success: true, data: solicitudes });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/autorizaciones
 * El vendedor crea una solicitud de autorización de descuento desde el POS.
 * Roles: vendedor, admin, super_admin.
 */
export async function POST(request: Request) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    if (!["vendedor", "admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const {
      empleadoNombre,
      montoVenta,
      montoDescuento,
      porcentajeCalculado,
      esMontFijo,
      razon,
      contexto,
    } = body;

    if (!empleadoNombre || montoVenta == null || montoDescuento == null) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const solicitud = await crearSolicitudAutorizacion({
      distribuidorId: distribuidorId ?? undefined,
      empleadoId: userId,
      empleadoNombre,
      montoVenta: Number(montoVenta),
      montoDescuento: Number(montoDescuento),
      porcentajeCalculado: Number(porcentajeCalculado ?? 0),
      esMontFijo: Boolean(esMontFijo),
      razon: razon ?? undefined,
      contexto: contexto ?? undefined,
    });

    return NextResponse.json({ success: true, data: solicitud }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
