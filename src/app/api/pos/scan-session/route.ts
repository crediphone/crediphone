/**
 * FASE 65: QR Bridge — crear sesión de escaneo móvil
 * POST /api/pos/scan-session → genera token + URL QR para el celular
 */
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateToken(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I/O/1/0 para evitar confusiones
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    // Solo roles que pueden usar el POS
    const rolesPermitidos = ["admin", "super_admin", "vendedor"];
    if (!role || !rolesPermitidos.includes(role)) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const token = generateToken(12);

    const { data, error } = await supabase
      .from("pos_scan_sessions")
      .insert({
        token,
        distribuidor_id: distribuidorId ?? null,
        created_by: userId,
        codigos: [],
        activa: true,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      })
      .select()
      .single();

    if (error) throw error;

    // Derivar URL base del request real (no del env var que se inlinea al compilar)
    let baseUrl: string;
    try {
      const { protocol, host } = new URL(request.url);
      baseUrl = `${protocol}//${host}`;
    } catch {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
    }
    const mobileUrl = `${baseUrl}/pos/scan/${token}`;

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        token: data.token,
        mobileUrl,
        expiresAt: data.expires_at,
      },
    });
  } catch (error) {
    console.error("Error al crear sesión de escaneo:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
