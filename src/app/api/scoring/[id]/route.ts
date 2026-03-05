import { NextRequest, NextResponse } from "next/server";
import { getOrCalculateScoring } from "@/lib/db/scoring";

/**
 * GET /api/scoring/:clienteId
 * Obtiene el scoring crediticio de un cliente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clienteId } = await params;

    // Obtener o calcular scoring
    const scoring = await getOrCalculateScoring(clienteId);

    if (!scoring) {
      return NextResponse.json(
        { error: "No se pudo obtener el scoring del cliente. Puede que el cliente no exista o haya un problema con la base de datos." },
        { status: 404 }
      );
    }

    return NextResponse.json(scoring);
  } catch (error) {
    console.error("[API] Error en GET /api/scoring:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error interno del servidor: ${errorMessage}` },
      { status: 500 }
    );
  }
}

