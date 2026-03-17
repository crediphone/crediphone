import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { getTraspasosPendientes, getTraspasos, countTraspasosPendientes } from "@/lib/db/traspasos";

/**
 * GET /api/traspasos-anticipo
 * Lista traspasos para el distribuidor actual.
 * Query params: estado (pendiente|confirmado|discrepancia), count (true para solo el conteo)
 *
 * Roles permitidos: vendedor, admin, super_admin (técnico solo ve los propios — filtro en DB)
 */
export async function GET(request: Request) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado") as "pendiente" | "confirmado" | "discrepancia" | null;
    const onlyCount = searchParams.get("count") === "true";

    const filterDistribuidorId = isSuperAdmin ? undefined : (distribuidorId ?? undefined);

    if (onlyCount) {
      const count = await countTraspasosPendientes(filterDistribuidorId);
      return NextResponse.json({ success: true, count });
    }

    let traspasos;
    if (estado === "pendiente" || !estado) {
      traspasos = await getTraspasosPendientes(filterDistribuidorId);
    } else {
      traspasos = await getTraspasos({ distribuidorId: filterDistribuidorId, estado: estado || undefined });
    }

    // El técnico solo ve sus propios traspasos
    if (role === "tecnico") {
      traspasos = traspasos.filter((t) => t.tecnicoId === userId);
    }

    return NextResponse.json({ success: true, data: traspasos });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al obtener traspasos", message: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}
