import { NextResponse } from "next/server";
import {
  getOrdenReparacionById,
  getOrdenReparacionDetalladaById,
  updateDiagnostico,
  cambiarEstadoOrden,
} from "@/lib/db/reparaciones";
import { notificarCambioEstado } from "@/lib/notificaciones-reparaciones";
import type { EstadoOrdenReparacion, DiagnosticoFormData } from "@/types";

/**
 * GET /api/reparaciones/[id]
 * Obtiene una orden de reparación por ID con información detallada
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
          message: "El ID proporcionado no es un UUID válido",
        },
        { status: 400 }
      );
    }

    const orden = await getOrdenReparacionDetalladaById(id);

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

    return NextResponse.json({
      success: true,
      data: orden,
    });
  } catch (error) {
    console.error("Error en GET /api/reparaciones/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener orden de reparación",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reparaciones/[id]
 * Actualiza una orden de reparación
 *
 * Casos de uso:
 * 1. Actualizar diagnóstico (body.diagnostico)
 * 2. Cambiar estado (body.estado)
 * 3. Actualizar notas u otros campos
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
          message: "El ID proporcionado no es un UUID válido",
        },
        { status: 400 }
      );
    }

    let ordenActualizada;

    // Caso 1: Actualizar diagnóstico
    if (body.diagnostico) {
      const diagnosticoData: DiagnosticoFormData = {
        diagnosticoTecnico: body.diagnostico.diagnosticoTecnico,
        costoReparacion: body.diagnostico.costoReparacion,
        costoPartes: body.diagnostico.costoPartes,
        partesReemplazadas: body.diagnostico.partesReemplazadas || [],
        fechaEstimadaEntrega: body.diagnostico.fechaEstimadaEntrega
          ? new Date(body.diagnostico.fechaEstimadaEntrega)
          : undefined,
        notasTecnico: body.diagnostico.notasTecnico,
        requiereAprobacion: body.diagnostico.requiereAprobacion ?? true,
      };

      ordenActualizada = await updateDiagnostico(id, diagnosticoData);

      return NextResponse.json({
        success: true,
        data: ordenActualizada,
        message: "Diagnóstico actualizado exitosamente",
      });
    }

    // Caso 2: Cambiar estado
    if (body.estado) {
      // Validar estado
      const estadosValidos: EstadoOrdenReparacion[] = [
        "recibido",
        "diagnostico",
        "presupuesto",
        "aprobado",
        "en_reparacion",
        "completado",
        "listo_entrega",
        "entregado",
        "no_reparable",
        "cancelado",
      ];

      if (!estadosValidos.includes(body.estado)) {
        return NextResponse.json(
          {
            success: false,
            error: "Estado inválido",
            message: `El estado debe ser uno de: ${estadosValidos.join(", ")}`,
          },
          { status: 400 }
        );
      }

      ordenActualizada = await cambiarEstadoOrden(
        id,
        body.estado,
        body.notas
      );

      // FASE 10: Notificar automáticamente al cambiar estado
      let notificaciones: any[] = [];
      try {
        const ordenDetallada = await getOrdenReparacionDetalladaById(id);
        if (ordenDetallada) {
          notificaciones = await notificarCambioEstado(
            ordenDetallada,
            body.estado,
            body.notas
          );
        }
      } catch (notifError) {
        console.error("Error al enviar notificaciones (no bloquea):", notifError);
      }

      return NextResponse.json({
        success: true,
        data: ordenActualizada,
        message: `Estado actualizado a "${body.estado}"`,
        notificaciones,
      });
    }

    // Si no hay cambios específicos, retornar error
    return NextResponse.json(
      {
        success: false,
        error: "Datos insuficientes",
        message:
          "Debe proporcionar 'diagnostico' o 'estado' para actualizar la orden",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error en PUT /api/reparaciones/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar orden de reparación",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reparaciones/[id]
 * Cancela una orden de reparación (soft delete)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID inválido",
          message: "El ID proporcionado no es un UUID válido",
        },
        { status: 400 }
      );
    }

    // Soft delete: cambiar estado a "cancelado"
    await cambiarEstadoOrden(id, "cancelado", "Orden cancelada por usuario");

    return NextResponse.json({
      success: true,
      message: "Orden cancelada correctamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/reparaciones/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cancelar orden de reparación",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
