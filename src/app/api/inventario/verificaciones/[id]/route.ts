import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import {
  getVerificacionById,
  completarVerificacion,
  cancelarVerificacion,
  getVerificacionItems,
  getProductosFaltantes,
  getDiferenciasVerificacion,
  ajustarStockVerificacion,
} from "@/lib/db/verificaciones";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "items") {
      const items = await getVerificacionItems(id);
      return NextResponse.json({ success: true, data: items });
    }

    if (action === "faltantes") {
      const faltantes = await getProductosFaltantes(id);
      return NextResponse.json({ success: true, data: faltantes });
    }

    if (action === "diferencias") {
      const diferencias = await getDiferenciasVerificacion(id);
      return NextResponse.json({ success: true, data: diferencias });
    }

    const verificacion = await getVerificacionById(id);

    if (!verificacion) {
      return NextResponse.json(
        { success: false, error: "Verificación no encontrada" },
        { status: 404 }
      );
    }

    // Check if user owns this verification or is admin/super_admin
    if (
      verificacion.usuarioId !== userId &&
      role !== "admin" &&
      role !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "No tiene permisos para ver esta verificación" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: verificacion });
  } catch (error: any) {
    console.error("Error in GET /api/inventario/verificaciones/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al obtener verificación",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const action = body.action;

    // Get verificacion to check ownership
    const verificacion = await getVerificacionById(id);
    if (!verificacion) {
      return NextResponse.json(
        { success: false, error: "Verificación no encontrada" },
        { status: 404 }
      );
    }

    // Owner or admin/super_admin can modify
    if (verificacion.usuarioId !== userId && role !== "admin" && role !== "super_admin") {
      return NextResponse.json(
        { error: "Solo el creador puede modificar esta verificación" },
        { status: 403 }
      );
    }

    if (action === "completar") {
      const updated = await completarVerificacion(id, body.notas);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "cancelar") {
      const updated = await cancelarVerificacion(id);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "ajustar_stock") {
      // Solo admin / super_admin
      const { role } = await import("@/lib/auth/server").then((m) =>
        m.getAuthContext()
      );
      if (!["admin", "super_admin"].includes(role ?? "")) {
        return NextResponse.json(
          { success: false, error: "Solo administradores pueden ajustar el stock" },
          { status: 403 }
        );
      }
      const resultado = await ajustarStockVerificacion(id);
      return NextResponse.json({ success: true, data: resultado });
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in PUT /api/inventario/verificaciones/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al actualizar verificación",
      },
      { status: 500 }
    );
  }
}
