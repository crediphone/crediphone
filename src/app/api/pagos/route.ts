import { NextResponse } from "next/server";
import { getPagos, createPago } from "@/lib/db/pagos";
import { getDistribuidorId } from "@/lib/auth/server";

export async function GET() {
  try {
    // super_admin returns null → no filter (sees all); admin returns their distribuidorId
    const distribuidorId = await getDistribuidorId();
    const pagos = await getPagos(distribuidorId ?? undefined);

    return NextResponse.json({
      success: true,
      count: pagos.length,
      data: pagos,
    });
  } catch (error) {
    console.error("Error al obtener pagos:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener pagos",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nuevoPago = await createPago(body);

    return NextResponse.json({
      success: true,
      data: nuevoPago,
    }, { status: 201 });
  } catch (error) {
    console.error("Error al crear pago:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al crear pago",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
