import { NextResponse } from "next/server";
import { getPagoById, updatePago, deletePago } from "@/lib/db/pagos";
import { requireAuth } from "@/lib/auth/guard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["admin", "vendedor", "cobrador", "super_admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const pago = await getPagoById(id);

    if (!pago) {
      return NextResponse.json(
        {
          success: false,
          error: "Pago no encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pago,
    });
  } catch (error) {
    console.error("Error al obtener pago:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener pago",
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
    const auth = await requireAuth(["admin", "cobrador", "super_admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const pagoActualizado = await updatePago(id, body);

    return NextResponse.json({
      success: true,
      data: pagoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar pago:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar pago",
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
    await deletePago(id);

    return NextResponse.json({
      success: true,
      message: "Pago eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar pago:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar pago",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
