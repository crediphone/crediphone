import { NextResponse } from "next/server";
import { getProductoById, updateProducto, deleteProducto } from "@/lib/db/productos";
import { requireAuth } from "@/lib/auth/guard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["admin", "vendedor", "super_admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const producto = await getProductoById(id);

    if (!producto) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: producto,
    });
  } catch (error) {
    console.error("Error al obtener producto:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener producto",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["admin", "super_admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const productoActualizado = await updateProducto(id, body);

    return NextResponse.json({
      success: true,
      data: productoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar producto",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["admin", "super_admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;

    await deleteProducto(id);

    return NextResponse.json({
      success: true,
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar producto",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
