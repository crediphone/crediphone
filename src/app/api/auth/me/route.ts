import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // Paso 1: verificar sesión con client normal
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ success: false, user: null });
    }

    // Paso 2: leer public.users con adminClient para bypassear RLS
    // (igual que getAuthContext — evita que RLS devuelva null y force role=vendedor)
    const adminClient = createAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from("users")
      .select("id, email, name, role, foto_perfil, activo, distribuidor_id")
      .eq("id", authUser.id)
      .single();

    if (userError || !userData) {
      // Usuario autenticado en auth.users pero sin fila en public.users
      // No asumir rol — devolver error explícito para debugging
      console.error("[/api/auth/me] Usuario sin fila en public.users:", authUser.id, userError?.message);
      return NextResponse.json({
        success: false,
        user: null,
        error: "Usuario no encontrado en la base de datos. Contacta al administrador.",
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        fotoPerfil: userData.foto_perfil,
        activo: userData.activo,
        distribuidorId: userData.distribuidor_id,
      },
    });
  } catch (error) {
    console.error("Error en /api/auth/me:", error);
    return NextResponse.json({ success: false, user: null }, { status: 500 });
  }
}
