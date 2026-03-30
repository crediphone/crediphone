/**
 * FASE 55: POST /api/whatsapp/test-connection
 * Verifica que las credenciales de Meta Cloud API sean válidas.
 *
 * SECURITY: El accessToken se lee directo de la DB (nunca desde el cliente).
 * El cliente solo puede enviar phoneNumberId y apiVersion.
 */

import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    if (!["admin", "super_admin"].includes(role ?? "")) {
      return NextResponse.json({ success: false, error: "Sin permisos" }, { status: 403 });
    }

    // Solo aceptar phoneNumberId y apiVersion del cliente — el token viene de la DB
    const body = await request.json();
    const apiVersion: string = body.apiVersion ?? "v20.0";

    // Leer credenciales directamente de la DB (nunca desde el cliente)
    const supabase = createAdminClient();
    let configQuery = supabase
      .from("configuracion")
      .select("wa_phone_number_id, wa_access_token, wa_api_version")
      .limit(1);
    if (distribuidorId) {
      configQuery = configQuery.eq("distribuidor_id", distribuidorId);
    }
    const { data: cfg, error: cfgError } = await configQuery.single();

    if (cfgError || !cfg) {
      return NextResponse.json(
        { success: false, error: "No se encontró la configuración de WhatsApp" },
        { status: 404 }
      );
    }

    const phoneNumberId: string = cfg.wa_phone_number_id ?? "";
    const accessToken: string   = cfg.wa_access_token   ?? "";
    const resolvedApiVersion    = apiVersion || cfg.wa_api_version || "v20.0";

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { success: false, error: "Configura Phone Number ID y Access Token antes de probar" },
        { status: 400 }
      );
    }

    // Llamar a la Graph API para verificar el número de teléfono
    const url = `https://graph.facebook.com/${resolvedApiVersion}/${phoneNumberId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message ?? `HTTP ${res.status}`;
      return NextResponse.json({ success: false, error: errMsg });
    }

    const displayPhoneNumber = data?.display_phone_number ?? data?.verified_name ?? phoneNumberId;

    return NextResponse.json({
      success: true,
      displayPhoneNumber,
      verifiedName: data?.verified_name,
      qualityRating: data?.quality_rating,
    });
  } catch (error) {
    console.error("[POST /api/whatsapp/test-connection]", error);
    return NextResponse.json(
      { success: false, error: "Error al verificar conexión" },
      { status: 500 }
    );
  }
}
