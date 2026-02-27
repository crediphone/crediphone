import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/distribuidores/[id]/asignar-empleado
 * Asigna uno o varios empleados existentes a este distribuidor.
 * Solo super_admin puede ejecutar esta acción.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    if (role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Solo super_admin puede asignar empleados" }, { status: 403 });
    }

    const { id: distribuidorId } = await params;
    const body = await request.json();

    // Acepta un array o un solo ID
    const empleadoIds: string[] = Array.isArray(body.empleadoIds)
      ? body.empleadoIds
      : body.empleadoId
        ? [body.empleadoId]
        : [];

    if (empleadoIds.length === 0) {
      return NextResponse.json({ success: false, error: "Debes indicar al menos un empleadoId" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verificar que el distribuidor existe
    const { data: dist } = await supabase
      .from("distribuidores")
      .select("id, nombre")
      .eq("id", distribuidorId)
      .single();

    if (!dist) {
      return NextResponse.json({ success: false, error: "Distribuidor no encontrado" }, { status: 404 });
    }

    // Actualizar distribuidor_id de todos los empleados seleccionados
    // Excluir super_admin (no se les puede asignar distribuidor)
    const { data: updated, error } = await supabase
      .from("users")
      .update({ distribuidor_id: distribuidorId })
      .in("id", empleadoIds)
      .neq("role", "super_admin")
      .select("id, name, role");

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      asignados: updated?.length ?? 0,
      data: updated,
      message: `${updated?.length ?? 0} empleado(s) asignados a ${dist.nombre}`,
    });
  } catch (error) {
    console.error("Error en POST /api/admin/distribuidores/[id]/asignar-empleado:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
