import { NextResponse } from "next/server";
import { getCreditos, createCredito } from "@/lib/db/creditos";
import { getDistribuidorId } from "@/lib/auth/server";

export async function GET() {
  try {
    // super_admin returns null → no filter (sees all); admin returns their distribuidorId
    const distribuidorId = await getDistribuidorId();
    const creditos = await getCreditos(distribuidorId ?? undefined);

    return NextResponse.json({
      success: true,
      count: creditos.length,
      data: creditos,
    });
  } catch (error) {
    console.error("Error al obtener créditos:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener créditos",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const distribuidorId = await getDistribuidorId();

    const nuevoCredito = await createCredito({
      ...body,
      // Inject distribuidorId if not already set by the client
      distribuidorId: body.distribuidorId || distribuidorId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: nuevoCredito,
    }, { status: 201 });
  } catch (error) {
    console.error("Error al crear crédito:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al crear crédito",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
