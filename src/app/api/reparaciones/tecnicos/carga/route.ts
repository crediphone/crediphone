import { NextResponse } from "next/server";
import { getCargaTecnicos } from "@/lib/db/reparaciones";

/**
 * GET /api/reparaciones/tecnicos/carga
 * Obtiene estadísticas de carga de trabajo para todos los técnicos activos
 *
 * Información retornada:
 * - tecnicoId: UUID del técnico
 * - nombreTecnico: Nombre del técnico
 * - ordenesActivas: Número de órdenes activas (no entregadas, no canceladas, no_reparables)
 * - ordenesRecibidas: Órdenes en estado "recibido"
 * - ordenesDiagnostico: Órdenes en estado "diagnostico"
 * - ordenesEnReparacion: Órdenes en estado "en_reparacion"
 * - ordenesCompletadasHoy: Órdenes completadas hoy
 *
 * Uso principal:
 * - Debugging del sistema de balanceo round-robin
 * - Dashboard de asignación manual de técnicos
 * - Reportes de productividad
 */
export async function GET(request: Request) {
  try {
    const cargaTecnicos = await getCargaTecnicos();

    return NextResponse.json({
      success: true,
      count: cargaTecnicos.length,
      data: cargaTecnicos,
    });
  } catch (error) {
    console.error("Error en GET /api/reparaciones/tecnicos/carga:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener carga de técnicos",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
