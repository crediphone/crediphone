import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  cerrarCaja,
  agregarMovimientoCaja,
  getMovimientosSesion,
} from "@/lib/db/caja";

/**
 * GET /api/pos/caja/[id]
 * Obtiene movimientos de una sesión
 * Acceso: admin, vendedor (propietario de la sesión), super_admin
 */
export async function GET(
  request: NextRequest,
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

    if (!role || !["admin", "vendedor", "super_admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      );
    }

    // Verificar que la sesión pertenece al usuario (a menos que sea admin/super_admin)
    const adminClient = createAdminClient();
    const { data: sesionData } = await adminClient
      .from("caja_sesiones")
      .select("usuario_id")
      .eq("id", id)
      .single();

    if (!sesionData) {
      return NextResponse.json(
        { success: false, error: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    if (
      role !== "admin" &&
      role !== "super_admin" &&
      sesionData.usuario_id !== userId
    ) {
      return NextResponse.json(
        { success: false, error: "No autorizado para ver esta sesión" },
        { status: 403 }
      );
    }

    // Obtener movimientos
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "movimientos") {
      const movimientos = await getMovimientosSesion(id);
      return NextResponse.json({ success: true, data: movimientos });
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en GET /api/pos/caja/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener datos",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pos/caja/[id]
 * Actualiza sesión (cerrar caja o agregar movimiento)
 * Acceso: admin, vendedor (propietario de la sesión), super_admin
 */
export async function PUT(
  request: NextRequest,
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

    if (!role || !["admin", "vendedor", "super_admin"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();

    // Verificar que la sesión pertenece al usuario (a menos que sea admin/super_admin)
    const { data: sesionData } = await adminClient
      .from("caja_sesiones")
      .select("usuario_id")
      .eq("id", id)
      .single();

    if (!sesionData) {
      return NextResponse.json(
        { success: false, error: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    if (
      role !== "admin" &&
      role !== "super_admin" &&
      sesionData.usuario_id !== userId
    ) {
      return NextResponse.json(
        { success: false, error: "No autorizado para modificar esta sesión" },
        { status: 403 }
      );
    }

    // Obtener nombre del usuario para el log del movimiento
    const { data: userData } = await adminClient
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    // Obtener datos del body
    const body = await request.json();
    const { action } = body;

    if (action === "cerrar") {
      const { montoFinal, notas } = body;

      if (typeof montoFinal !== "number" || montoFinal < 0) {
        return NextResponse.json(
          { success: false, error: "Monto final inválido" },
          { status: 400 }
        );
      }

      const sesion = await cerrarCaja(id, montoFinal, notas);

      return NextResponse.json({
        success: true,
        data: sesion,
        message: "Caja cerrada exitosamente",
      });
    }

    if (action === "movimiento") {
      const { tipo, monto, concepto } = body;

      if (!["deposito", "retiro"].includes(tipo)) {
        return NextResponse.json(
          { success: false, error: "Tipo de movimiento inválido" },
          { status: 400 }
        );
      }

      if (typeof monto !== "number" || monto <= 0) {
        return NextResponse.json(
          { success: false, error: "Monto inválido" },
          { status: 400 }
        );
      }

      if (!concepto || concepto.trim() === "") {
        return NextResponse.json(
          { success: false, error: "Debe especificar un concepto" },
          { status: 400 }
        );
      }

      const movimiento = await agregarMovimientoCaja(
        id,
        tipo,
        monto,
        concepto,
        userData?.name || undefined
      );

      return NextResponse.json({
        success: true,
        data: movimiento,
        message: `${tipo === "deposito" ? "Depósito" : "Retiro"} registrado exitosamente`,
      });
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en PUT /api/pos/caja/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al actualizar sesión",
      },
      { status: 500 }
    );
  }
}
