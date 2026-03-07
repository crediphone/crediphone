import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token no proporcionado" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Buscar sesión
    const { data: sesion, error: sesionError } = await supabase
      .from("sesiones_fotos_qr")
      .select("orden_id")
      .eq("token", token)
      .single();

    if (sesionError || !sesion) {
      return NextResponse.json(
        { success: false, message: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    // Obtener imágenes subidas vía QR para esta orden
    const { data: imagenes, error: imagenesError } = await supabase
      .from("imagenes_reparacion")
      .select("*")
      .eq("orden_id", sesion.orden_id)
      .eq("subido_desde", "qr")
      .order("created_at", { ascending: true });

    if (imagenesError) {
      console.error("Error al obtener imágenes:", imagenesError);
      return NextResponse.json(
        { success: false, message: "Error al obtener imágenes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imagenes: imagenes || [],
      total: imagenes?.length || 0,
    });
  } catch (error) {
    console.error("Error en GET /api/reparaciones/qr/[token]/fotos:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
