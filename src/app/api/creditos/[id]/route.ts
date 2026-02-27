import { NextResponse } from "next/server";
import { getCreditoById, updateCredito, deleteCredito } from "@/lib/db/creditos";
import { getAuthContext } from "@/lib/auth/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role, distribuidorId } = await getAuthContext();
    const credito = await getCreditoById(id, role === "super_admin" ? undefined : distribuidorId ?? undefined);

    if (!credito) {
      return NextResponse.json(
        {
          success: false,
          error: "Crédito no encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: credito,
    });
  } catch (error) {
    console.error("Error al obtener crédito:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener crédito",
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
    const { id } = await params;
    const body = await request.json();
    const { role, distribuidorId } = await getAuthContext();

    const creditoActualizado = await updateCredito(id, body, role === "super_admin" ? undefined : distribuidorId ?? undefined);

    return NextResponse.json({
      success: true,
      data: creditoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar crédito:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar crédito",
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
    const { id } = await params;
    const { role, distribuidorId } = await getAuthContext();
    await deleteCredito(id, role === "super_admin" ? undefined : distribuidorId ?? undefined);

    return NextResponse.json({
      success: true,
      message: "Crédito eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar crédito:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar crédito",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
