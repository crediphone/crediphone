import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/push/subscribe
 * Guarda una suscripción Web Push para el dispositivo actual del usuario.
 *
 * Body: { endpoint: string; keys: { p256dh: string; auth: string } }
 *
 * DELETE /api/push/subscribe
 * Elimina la suscripción del dispositivo actual (opt-out).
 *
 * Body: { endpoint: string }
 */

export async function POST(request: Request) {
  try {
    const { userId, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Suscripción incompleta" },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;
    const supabase = createAdminClient();

    // Upsert — si el dispositivo ya existe, actualiza last_used_at
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        distribuidor_id: distribuidorId ?? null,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "user_id,endpoint" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en POST /api/push/subscribe:", error);
    return NextResponse.json(
      { error: "Error al guardar suscripción" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/push/subscribe:", error);
    return NextResponse.json(
      { error: "Error al eliminar suscripción" },
      { status: 500 }
    );
  }
}
