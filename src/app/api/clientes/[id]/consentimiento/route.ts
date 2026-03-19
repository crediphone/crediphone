import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();
    const { error } = await supabase.from("clientes").update({
      acepta_notificaciones_whatsapp: body.aceptaNotificaciones ?? false,
      acepta_promociones_whatsapp: body.aceptaPromociones ?? false,
      preferencias_promociones: body.preferencias ?? {},
      fecha_consentimiento: new Date().toISOString(),
      consentimiento_canal: "presencial",
      consentimiento_fecha: new Date().toISOString(),
      consentimiento_empleado_id: userId,
    }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true, message: "Consentimiento registrado" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al registrar consentimiento" }, { status: 500 });
  }
}
