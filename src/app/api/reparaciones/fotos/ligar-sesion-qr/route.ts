import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthContext } from "@/lib/auth/server";

/**
 * POST /api/reparaciones/fotos/ligar-sesion-qr
 *
 * Liga las fotos subidas por QR (antes de crear la orden) a la orden recién creada.
 * Esto pasa cuando el empleado usa el QR durante la creación de la orden:
 *   1. Se genera el QR sin orden_id (null)
 *   2. El cliente sube fotos desde su celular → quedan con orden_id = null
 *   3. Al guardar la orden, se llama este endpoint para asignarles el orden_id real
 *
 * Soporta dos formatos de path (histórico):
 *   - reparaciones/temp/{token}/... (formato actual)
 *   - temp/{token}/...              (formato antiguo — antes del prefix reparaciones/)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionToken, ordenId } = body;

    if (!sessionToken || !ordenId) {
      return NextResponse.json(
        { success: false, message: "sessionToken y ordenId son requeridos" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Buscar la sesión QR por token
    const { data: sesion, error: sesionError } = await supabase
      .from("sesiones_fotos_qr")
      .select("id, orden_id")
      .eq("token", sessionToken)
      .single();

    if (sesionError || !sesion) {
      return NextResponse.json(
        { success: false, message: "Sesión QR no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la orden existe
    const { data: orden, error: ordenError } = await supabase
      .from("ordenes_reparacion")
      .select("id")
      .eq("id", ordenId)
      .single();

    if (ordenError || !orden) {
      return NextResponse.json(
        { success: false, message: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Ligar fotos en formato actual: reparaciones/temp/{token}/...
    const { data: ligadas1, error: err1 } = await supabase
      .from("imagenes_reparacion")
      .update({ orden_id: ordenId })
      .is("orden_id", null)
      .like("path_storage", `reparaciones/temp/${sessionToken}/%`)
      .select("id");

    if (err1) {
      console.error("[ligar-sesion-qr] Error al ligar fotos (formato actual):", err1.message);
    }

    // Ligar fotos en formato antiguo: temp/{token}/... (compatibilidad retroactiva)
    const { data: ligadas2, error: err2 } = await supabase
      .from("imagenes_reparacion")
      .update({ orden_id: ordenId })
      .is("orden_id", null)
      .like("path_storage", `temp/${sessionToken}/%`)
      .select("id");

    if (err2) {
      console.error("[ligar-sesion-qr] Error al ligar fotos (formato antiguo):", err2.message);
    }

    const totalLigadas = (ligadas1?.length ?? 0) + (ligadas2?.length ?? 0);

    // Actualizar la sesión: apuntar a la orden real y desactivar para evitar uploads adicionales al path temp
    const { error: sesionUpdateErr } = await supabase
      .from("sesiones_fotos_qr")
      .update({ orden_id: ordenId, activa: false })
      .eq("token", sessionToken);

    if (sesionUpdateErr) {
      console.error("[ligar-sesion-qr] Error al actualizar sesión:", sesionUpdateErr.message);
    }

    return NextResponse.json({
      success: true,
      fotosLigadas: totalLigadas,
    });
  } catch (error) {
    console.error("Error en POST /api/reparaciones/fotos/ligar-sesion-qr:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
