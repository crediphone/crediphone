import { NextRequest, NextResponse } from "next/server";
import {
  getVentas,
  createVenta,
  getEstadisticasPOS,
} from "@/lib/db/ventas";
import { getSesionActiva } from "@/lib/db/caja";
import { getAuthContext } from "@/lib/auth/server";
import type { NuevaVentaFormData } from "@/types";

const ALLOWED_READ_ROLES = ["admin", "vendedor", "cobrador", "super_admin"];
const ALLOWED_WRITE_ROLES = ["admin", "vendedor", "super_admin"];

/**
 * GET /api/pos/ventas
 * Lista ventas o estadísticas
 * Acceso: admin, vendedor, cobrador, super_admin
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!role || !ALLOWED_READ_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    if (!isSuperAdmin && !distribuidorId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const distId = isSuperAdmin ? undefined : (distribuidorId ?? undefined);

    // Verificar si se solicitan estadísticas
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "estadisticas") {
      const stats = await getEstadisticasPOS(distId);
      return NextResponse.json({ success: true, data: stats });
    }

    // Obtener ventas
    const ventas = await getVentas(100, distId);
    return NextResponse.json({ success: true, data: ventas });
  } catch (error) {
    console.error("Error en GET /api/pos/ventas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener ventas",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pos/ventas
 * Crea una nueva venta
 * Acceso: admin, vendedor, super_admin
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (!role || !ALLOWED_WRITE_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Solo admin y vendedores." },
        { status: 403 }
      );
    }

    if (!isSuperAdmin && !distribuidorId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    // Obtener datos del body
    const body: NuevaVentaFormData = await request.json();

    // Validaciones
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "La venta debe tener al menos un producto" },
        { status: 400 }
      );
    }

    if (!body.metodoPago) {
      return NextResponse.json(
        { success: false, error: "Debe especificar un método de pago" },
        { status: 400 }
      );
    }

    const distId = isSuperAdmin ? undefined : (distribuidorId ?? undefined);

    // Obtener sesión activa del vendedor
    const sesionActiva = await getSesionActiva(userId);

    // Crear venta
    const venta = await createVenta(
      body,
      userId,
      sesionActiva?.id,
      distId
    );

    return NextResponse.json({
      success: true,
      data: venta,
      message: "Venta creada exitosamente",
    });
  } catch (error) {
    console.error("Error en POST /api/pos/ventas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear venta",
      },
      { status: 500 }
    );
  }
}
