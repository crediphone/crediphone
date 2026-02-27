import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import {
  getPiezasReparacion,
  agregarPiezaReparacion,
  quitarPiezaReparacion,
} from "@/lib/db/reparaciones";

/**
 * GET /api/reparaciones/[id]/piezas
 * Obtiene las piezas de inventario usadas en una reparación
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const piezas = await getPiezasReparacion(id);

    return NextResponse.json({ success: true, data: piezas });
  } catch (error) {
    console.error("Error en GET /api/reparaciones/[id]/piezas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener piezas",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reparaciones/[id]/piezas
 * Agrega una pieza del inventario a la reparación (descuenta stock)
 * Acceso: admin, tecnico, super_admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!role || !["admin", "tecnico", "super_admin"].includes(role)) {
      return NextResponse.json(
        { error: "Solo técnicos y administradores pueden agregar piezas" },
        { status: 403 }
      );
    }

    const { id: ordenId } = await params;
    const body = await request.json();
    const { productoId, cantidad, costoUnitario, notas } = body;

    if (!productoId) {
      return NextResponse.json(
        { success: false, error: "productoId es requerido" },
        { status: 400 }
      );
    }

    if (!cantidad || typeof cantidad !== "number" || cantidad < 1) {
      return NextResponse.json(
        { success: false, error: "cantidad debe ser un número mayor a 0" },
        { status: 400 }
      );
    }

    if (costoUnitario === undefined || typeof costoUnitario !== "number" || costoUnitario < 0) {
      return NextResponse.json(
        { success: false, error: "costoUnitario debe ser un número válido" },
        { status: 400 }
      );
    }

    const pieza = await agregarPiezaReparacion(
      ordenId,
      productoId,
      cantidad,
      costoUnitario,
      userId,
      notas
    );

    return NextResponse.json(
      { success: true, data: pieza, message: "Pieza agregada y stock actualizado" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en POST /api/reparaciones/[id]/piezas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al agregar pieza",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reparaciones/[id]/piezas
 * Quita una pieza de la reparación (devuelve stock al inventario)
 * Body: { piezaId: string }
 * Acceso: admin, tecnico, super_admin
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!role || !["admin", "tecnico", "super_admin"].includes(role)) {
      return NextResponse.json(
        { error: "Solo técnicos y administradores pueden quitar piezas" },
        { status: 403 }
      );
    }

    const { id: ordenId } = await params;
    const body = await request.json();
    const { piezaId } = body;

    if (!piezaId) {
      return NextResponse.json(
        { success: false, error: "piezaId es requerido" },
        { status: 400 }
      );
    }

    await quitarPiezaReparacion(piezaId, ordenId);

    return NextResponse.json({
      success: true,
      message: "Pieza retirada y stock devuelto al inventario",
    });
  } catch (error) {
    console.error("Error en DELETE /api/reparaciones/[id]/piezas:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al quitar pieza",
      },
      { status: 500 }
    );
  }
}
