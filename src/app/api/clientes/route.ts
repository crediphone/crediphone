import { NextResponse } from "next/server";
import { getClientes, createCliente } from "@/lib/db/clientes";
import { getAuthContext } from "@/lib/auth/server";

export async function GET() {
  try {
    const { userId, distribuidorId, isSuperAdmin } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    // super_admin sees all (undefined = no filter); admin sees only their store
    const clientes = await getClientes(isSuperAdmin ? undefined : (distribuidorId ?? undefined));

    return NextResponse.json({
      success: true,
      count: clientes.length,
      data: clientes,
    });
  } catch (error) {
    console.error("Error al obtener clientes:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener clientes",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, distribuidorId, isSuperAdmin } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // For super_admin: distribuidorId must come in the body or default to null
    // For admin/vendedor: inject their distribuidorId
    const effectiveDistribuidorId = isSuperAdmin
      ? (body.distribuidorId || null)
      : (distribuidorId || null);

    if (!effectiveDistribuidorId) {
      return NextResponse.json(
        { success: false, error: "Se requiere un distribuidor para crear el cliente" },
        { status: 400 }
      );
    }

    const nuevoCliente = await createCliente({
      ...body,
      distribuidorId: effectiveDistribuidorId,
    });

    return NextResponse.json({
      success: true,
      data: nuevoCliente,
    }, { status: 201 });
  } catch (error) {
    console.error("Error al crear cliente:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al crear cliente",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
