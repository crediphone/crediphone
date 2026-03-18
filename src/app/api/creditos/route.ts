import { NextResponse } from "next/server";
import { getCreditos, createCredito } from "@/lib/db/creditos";
import { requireAuth } from "@/lib/auth/guard";

export async function GET() {
  try {
    const auth = await requireAuth(["admin", "vendedor", "cobrador", "super_admin"]);
    if (!auth.ok) return auth.response;

    const distribuidorId = auth.isSuperAdmin ? null : auth.distribuidorId;
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
    const auth = await requireAuth(["admin", "vendedor", "super_admin"]);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const distribuidorId = auth.isSuperAdmin ? null : auth.distribuidorId;

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
