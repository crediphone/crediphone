import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * FASE 54: Sugerencias de marca/modelo para autocompletado en ProductoForm
 *
 * GET /api/productos/sugerencias?campo=marcas
 *   → { success: true, data: ["Apple", "Samsung", "Xiaomi", ...] }
 *
 * GET /api/productos/sugerencias?campo=modelos&marca=Samsung
 *   → { success: true, data: ["Galaxy S23", "Galaxy A54", ...] }
 *
 * Si el super_admin envía X-Distribuidor-Id, se filtra por ese distribuidor.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const campo = searchParams.get("campo"); // "marcas" | "modelos"
    const marcaFiltro = searchParams.get("marca") ?? "";
    const headers = request.headers;

    if (campo !== "marcas" && campo !== "modelos") {
      return NextResponse.json(
        { success: false, error: "Parámetro 'campo' inválido. Usa 'marcas' o 'modelos'." },
        { status: 400 }
      );
    }

    // Determinar el distribuidor efectivo
    let efectivoDistribuidorId: string | null = distribuidorId ?? null;
    if (role === "super_admin") {
      const headerDistribuidor = headers.get("X-Distribuidor-Id");
      if (headerDistribuidor) efectivoDistribuidorId = headerDistribuidor;
    }

    const supabase = createAdminClient();

    // Seleccionar solo el campo necesario para eficiencia
    let query = supabase
      .from("productos")
      .select(campo === "marcas" ? "marca" : "modelo")
      .not(campo === "marcas" ? "marca" : "modelo", "is", null)
      .neq(campo === "marcas" ? "marca" : "modelo", "");

    // Filtrar por distribuidor si aplica
    if (efectivoDistribuidorId) {
      query = query.eq("distribuidor_id", efectivoDistribuidorId);
    }

    // Al buscar modelos, filtrar por la marca seleccionada
    if (campo === "modelos" && marcaFiltro) {
      query = query.eq("marca", marcaFiltro);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Deduplicar y ordenar en memoria (PostgREST no tiene DISTINCT directo)
    const campo_col = campo === "marcas" ? "marca" : "modelo";
    const valores = [...new Set(
      (data as Record<string, string>[])
        .map((row) => row[campo_col])
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es-MX", { sensitivity: "base" }));

    return NextResponse.json({ success: true, data: valores });
  } catch (error) {
    console.error("Error al obtener sugerencias:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener sugerencias" },
      { status: 500 }
    );
  }
}
