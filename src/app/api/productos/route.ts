import { NextResponse } from "next/server";
import { getProductos, createProducto } from "@/lib/db/productos";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tienePermiso } from "@/lib/permisos";

export async function GET() {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    // super_admin ve todos los productos; los demás ven solo los de su distribuidor
    const filterDistribuidorId = role === "super_admin" ? undefined : (distribuidorId ?? undefined);

    const productos = await getProductos(filterDistribuidorId);

    return NextResponse.json({
      success: true,
      count: productos.length,
      data: productos,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener productos",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, role, distribuidorId, permisosExplicitos } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    // FASE 56: verificar permiso producto_crear (admin/super_admin siempre pueden; empleados con permiso explícito también)
    if (!tienePermiso(role, permisosExplicitos, "producto_crear")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    let effectiveDistribuidorId = distribuidorId;

    // Si super_admin no tiene distribuidor, usar el 'default'
    if (role === "super_admin" && !effectiveDistribuidorId) {
      const adminClient = createAdminClient();
      const { data: defaultDist } = await adminClient
        .from("distribuidores")
        .select("id")
        .eq("slug", "default")
        .single();

      if (defaultDist) {
        effectiveDistribuidorId = defaultDist.id;
      } else {
        return NextResponse.json(
          { success: false, error: "No se encontró distribuidor default para Super Admin" },
          { status: 400 }
        );
      }
    }

    if (!effectiveDistribuidorId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    const nuevoProducto = await createProducto({
      ...body,
      distribuidorId: effectiveDistribuidorId,
    });

    return NextResponse.json({
      success: true,
      data: nuevoProducto,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear producto:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al crear producto",
        message: error.message || "Error desconocido",
      },
      { status: 500 }
    );
  }
}
