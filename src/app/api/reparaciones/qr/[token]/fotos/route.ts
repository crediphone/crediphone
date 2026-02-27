import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente anónimo para acceso público
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

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

    // Buscar sesión
    const { data: sesion, error: sesionError } = await supabaseAnon
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

    // Obtener imágenes subidas
    const { data: imagenes, error: imagenesError } = await supabaseAnon
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
