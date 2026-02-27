import { NextResponse } from "next/server";
import { getCategorias } from "@/lib/db/categorias";
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
        // super_admin sin distribuidor: retornar todas las categorías (sin filtro)
      } else {
        return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
      }
    }

    // getCategorias requiere distribuidorId; si es super_admin sin distribuidor,
    // usamos string vacía para que la query no filtre (o podemos pasar undefined)
    const categorias = distribuidorId ? await getCategorias(distribuidorId) : [];

    return NextResponse.json({ success: true, data: categorias });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}
