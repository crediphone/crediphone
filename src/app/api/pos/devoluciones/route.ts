import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { crearDevolucion } from "@/lib/db/devoluciones";
import type { NuevaDevolucionPayload } from "@/types";

/**
 * POST /api/pos/devoluciones
 * Crea una devolución parcial o total de una venta POS.
 * Solo admin / super_admin.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
    }

    const body = (await req.json()) as NuevaDevolucionPayload;

    if (!body.ventaId || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const devolucion = await crearDevolucion(
      body,
      userId,
      distribuidorId ?? null
    );

    return NextResponse.json({ success: true, data: devolucion });
  } catch (error: any) {
    console.error("Error creando devolución:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}
