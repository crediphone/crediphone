import { NextResponse } from "next/server";
import { reasignarTecnico, getOrdenReparacionById } from "@/lib/db/reparaciones";

/**
 * POST /api/reparaciones/[id]/asignar-tecnico
 * Reasigna una orden de reparación a un técnico diferente
 *
 * Body:
 * - tecnicoId (required): UUID del nuevo técnico
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validar UUID de la orden
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de orden inválido",
          message: "El ID de orden proporcionado no es un UUID válido",
        },
        { status: 400 }
      );
    }

    // Validar que se proporcione tecnicoId
    if (!body.tecnicoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Técnico requerido",
          message: "Debe proporcionar el ID del técnico (tecnicoId)",
        },
        { status: 400 }
      );
    }

    // Validar UUID del técnico
    if (!uuidRegex.test(body.tecnicoId)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de técnico inválido",
          message: "El ID de técnico proporcionado no es un UUID válido",
        },
        { status: 400 }
      );
    }

    // Verificar que la orden existe
    const orden = await getOrdenReparacionById(id);
    if (!orden) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden no encontrada",
          message: `No se encontró una orden con el ID ${id}`,
        },
        { status: 404 }
      );
    }

    // Reasignar técnico (la función valida que el técnico sea válido y activo)
    await reasignarTecnico(id, body.tecnicoId);

    // Obtener orden actualizada
    const ordenActualizada = await getOrdenReparacionById(id);

    return NextResponse.json({
      success: true,
      data: ordenActualizada,
      message: "Técnico reasignado exitosamente",
    });
  } catch (error) {
    console.error("Error en POST /api/reparaciones/[id]/asignar-tecnico:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al reasignar técnico",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
