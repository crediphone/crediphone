import { NextResponse } from "next/server";
import {
  getServicioById,
  updateServicio,
  deleteServicio,
  upsertPrecioDistribuidor,
  deletePrecioDistribuidor,
  getPreciosPorServicio,
} from "@/lib/db/catalogo-servicios";
import { getAuthContext } from "@/lib/auth/server";

/**
 * GET /api/catalogo-servicios/[id]
 * Obtiene un servicio por id con sus precios por distribuidor.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await getAuthContext();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const servicio = await getServicioById(id);

    if (!servicio) {
      return NextResponse.json(
        { success: false, error: "Servicio no encontrado" },
        { status: 404 }
      );
    }

    const precios = await getPreciosPorServicio(id);

    return NextResponse.json({ success: true, data: { ...servicio, precios } });
  } catch (error) {
    console.error("Error en GET /api/catalogo-servicios/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener servicio" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/catalogo-servicios/[id]
 * Actualiza un servicio o establece precio por distribuidor.
 * Body puede incluir:
 *   - Campos del servicio (nombre, precioBase, activo, etc.)
 *   - { precioDistribuidor: { distribuidorId, precio } } → upsert precio
 *   - { eliminarPrecioDistribuidor: { distribuidorId } } → eliminar precio
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, role } = await getAuthContext();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    if (!role || !["admin", "super_admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Sin permisos" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Caso: establecer precio para un distribuidor
    if (body.precioDistribuidor) {
      const { distribuidorId, precio } = body.precioDistribuidor;
      if (!distribuidorId || precio === undefined) {
        return NextResponse.json(
          { success: false, error: "distribuidorId y precio son requeridos" },
          { status: 400 }
        );
      }
      const precio_ = await upsertPrecioDistribuidor(id, distribuidorId, precio);
      return NextResponse.json({ success: true, data: precio_ });
    }

    // Caso: eliminar precio de un distribuidor
    if (body.eliminarPrecioDistribuidor) {
      const { distribuidorId } = body.eliminarPrecioDistribuidor;
      if (!distribuidorId) {
        return NextResponse.json(
          { success: false, error: "distribuidorId es requerido" },
          { status: 400 }
        );
      }
      await deletePrecioDistribuidor(id, distribuidorId);
      return NextResponse.json({ success: true, message: "Precio eliminado" });
    }

    // Caso: actualizar campos del servicio
    const servicio = await updateServicio(id, body);
    return NextResponse.json({ success: true, data: servicio });
  } catch (error) {
    console.error("Error en PATCH /api/catalogo-servicios/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar servicio" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/catalogo-servicios/[id]
 * Elimina un servicio y sus precios por distribuidor (CASCADE).
 * Solo super_admin puede eliminar servicios globales.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, role } = await getAuthContext();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    if (!role || !["admin", "super_admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Sin permisos" },
        { status: 403 }
      );
    }

    await deleteServicio(id);

    return NextResponse.json({ success: true, message: "Servicio eliminado" });
  } catch (error) {
    console.error("Error en DELETE /api/catalogo-servicios/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar servicio" },
      { status: 500 }
    );
  }
}
