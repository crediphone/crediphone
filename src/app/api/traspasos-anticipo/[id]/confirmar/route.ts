import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { getSesionActiva } from "@/lib/db/caja";
import { confirmarTraspaso } from "@/lib/db/traspasos";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/traspasos-anticipo/[id]/confirmar
 *
 * El vendedor confirma el monto que realmente recibió del técnico.
 * - Si el monto coincide → estado: 'confirmado', entra a caja
 * - Si hay diferencia  → estado: 'discrepancia', entra a caja con monto real, admin recibe alerta
 *
 * Roles permitidos: vendedor, admin, super_admin (el técnico NO puede confirmar sus propios traspasos)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    // El técnico NO puede confirmar (antifraud: no puede confirmarse a sí mismo)
    if (role === "tecnico") {
      return NextResponse.json(
        { success: false, error: "El técnico no puede confirmar sus propios traspasos" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();

    if (body.montoConfirmado == null || Number(body.montoConfirmado) < 0) {
      return NextResponse.json({ success: false, error: "montoConfirmado es requerido y debe ser >= 0" }, { status: 400 });
    }

    // Buscar sesión de caja activa del vendedor para asentar el dinero real recibido
    let sesionCajaId: string | undefined;
    try {
      const sesion = await getSesionActiva(userId);
      sesionCajaId = sesion?.id;
    } catch {
      // Sin sesión — se registra sin caja
    }

    const { traspaso, hayDiscrepancia } = await confirmarTraspaso({
      traspasoId: id,
      vendedorId: userId,
      montoConfirmado: Number(body.montoConfirmado),
      notasVendedor: body.notasVendedor,
      sesionCajaId,
    });

    return NextResponse.json({
      success: true,
      data: traspaso,
      hayDiscrepancia,
      registradoEnCaja: !!sesionCajaId,
      message: hayDiscrepancia
        ? `Discrepancia registrada: técnico declaró $${traspaso.montoRegistrado.toFixed(2)}, vendedor confirmó $${traspaso.montoConfirmado?.toFixed(2)}. Se notificó al administrador.`
        : `Traspaso confirmado correctamente por $${traspaso.montoConfirmado?.toFixed(2)}.${sesionCajaId ? " Asentado en caja." : ""}`,
    });
  } catch (error) {
    console.error("Error al confirmar traspaso:", error);
    return NextResponse.json(
      { success: false, error: "Error al confirmar traspaso", message: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}
