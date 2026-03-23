/**
 * FASE 65: QR Bridge — polling + push de códigos
 *
 * GET  /api/pos/scan-session/[token]          → La PC hace polling: retorna codigos[] y estado
 * POST /api/pos/scan-session/[token]          → El móvil pushea un código escaneado
 * DELETE /api/pos/scan-session/[token]        → La PC cierra la sesión (o vence)
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ token: string }> };

// ── GET: polling desde la PC ──────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;
  if (!token) return NextResponse.json({ success: false, error: "Token requerido" }, { status: 400 });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pos_scan_sessions")
      .select("id, codigos, activa, expires_at")
      .eq("token", token)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Sesión no encontrada" }, { status: 404 });
    }

    const expired = new Date(data.expires_at) < new Date();
    if (expired && data.activa) {
      await supabase.from("pos_scan_sessions").update({ activa: false }).eq("token", token);
    }

    return NextResponse.json({
      success: true,
      data: {
        codigos: data.codigos ?? [],
        activa: data.activa && !expired,
        expiresAt: data.expires_at,
      },
    });
  } catch (error) {
    console.error("Error en polling scan session:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// ── POST: el móvil empuja un código ──────────────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  if (!token) return NextResponse.json({ success: false, error: "Token requerido" }, { status: 400 });

  try {
    const body = await req.json();
    const codigo: string = (body?.codigo || "").trim();
    if (!codigo) {
      return NextResponse.json({ success: false, error: "Código vacío" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verificar que la sesión existe y está activa
    const { data: session, error: fetchErr } = await supabase
      .from("pos_scan_sessions")
      .select("id, codigos, activa, expires_at")
      .eq("token", token)
      .single();

    if (fetchErr || !session) {
      return NextResponse.json({ success: false, error: "Sesión no encontrada" }, { status: 404 });
    }
    if (!session.activa || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "Sesión expirada o cerrada" }, { status: 410 });
    }

    // Agregar código (evitar duplicados consecutivos)
    const codigosActuales: string[] = session.codigos ?? [];
    const nuevoCodigos = [...codigosActuales, codigo];

    const { error: updateErr } = await supabase
      .from("pos_scan_sessions")
      .update({ codigos: nuevoCodigos })
      .eq("token", token);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, data: { total: nuevoCodigos.length } });
  } catch (error) {
    console.error("Error al pushear código:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// ── DELETE: la PC cierra la sesión ────────────────────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  const { token } = await params;
  if (!token) return NextResponse.json({ success: false, error: "Token requerido" }, { status: 400 });

  try {
    const supabase = createAdminClient();
    await supabase
      .from("pos_scan_sessions")
      .update({ activa: false })
      .eq("token", token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al cerrar sesión de escaneo:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
