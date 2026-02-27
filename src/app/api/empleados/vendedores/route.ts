import { NextResponse } from "next/server";
import { getEmpleadosPorRol } from "@/lib/db/empleados";

/**
 * GET /api/empleados/vendedores
 * Obtiene solo los vendedores activos
 */
export async function GET() {
  try {
    const vendedores = await getEmpleadosPorRol("vendedor");

    return NextResponse.json({
      success: true,
      count: vendedores.length,
      data: vendedores,
    });
  } catch (error) {
    console.error("Error en GET /api/empleados/vendedores:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener vendedores",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
