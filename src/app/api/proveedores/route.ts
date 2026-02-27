import { NextResponse } from "next/server";
import { getProveedores } from "@/lib/db/proveedores";
import { getDistribuidorId } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    let distribuidorId = await getDistribuidorId();

    if (!distribuidorId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const adminClient = createAdminClient();
        const { data: userData } = await adminClient
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userData?.role !== "super_admin") {
          return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
        }
      } else {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
      }
    }

    const proveedores = distribuidorId ? await getProveedores(distribuidorId) : [];

    return NextResponse.json({ success: true, data: proveedores });
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener proveedores" },
      { status: 500 }
    );
  }
}
