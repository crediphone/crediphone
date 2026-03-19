import { NextResponse } from "next/server";
import {
  getLotes,
  createLote,
} from "@/lib/db/lotes-piezas";
import { getAuthContext } from "@/lib/auth/server";
import type { LotePiezasFormData } from "@/types";

/**
 * GET /api/lotes-piezas
 * Obtiene todos los lotes de un distribuidor
 * - admin/super_admin: solo su distribuidor (o todos si super_admin)
 */
export async function GET(request: Request) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    // Solo admin y super_admin pueden ver lotes
    if (!role || !["admin", "super_admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para ver lotes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    // Filtro de distribuidor
    const filterDistribuidorId = isSuperAdmin ? undefined : (distribuidorId ?? undefined);

    const lotes = await getLotes(filterDistribuidorId, estado as any);

    return NextResponse.json({
      success: true,
      count: lotes.length,
      data: lotes,
    });
  } catch (error) {
    console.error("Error en GET /api/lotes-piezas:", error);
    return NextResponse.json(
      { success: false, error: "Error obteniendo lotes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lotes-piezas
 * Crea un nuevo lote de piezas
 */
export async function POST(request: Request) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    // Solo admin y super_admin pueden crear lotes
    if (!role || !["admin", "super_admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para crear lotes" },
        { status: 403 }
      );
    }

    if (!distribuidorId) {
      return NextResponse.json(
        { success: false, error: "Distribuidor no identificado" },
        { status: 400 }
      );
    }

    const body: LotePiezasFormData = await request.json();

    // Validar campos requeridos
    if (!body.proveedor || !body.fechaPedido) {
      return NextResponse.json(
        { success: false, error: "Proveedor y fecha de pedido son requeridos" },
        { status: 400 }
      );
    }

    const lote = await createLote(body, distribuidorId, userId);

    return NextResponse.json(
      { success: true, data: lote },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/lotes-piezas:", error);
    return NextResponse.json(
      { success: false, error: "Error creando lote" },
      { status: 500 }
    );
  }
}
