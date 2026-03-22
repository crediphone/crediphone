import { NextResponse } from "next/server";
import { getProductoById, updateProducto, deleteProducto } from "@/lib/db/productos";
import { requireAuth } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["admin", "vendedor", "super_admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const producto = await getProductoById(id);

    if (!producto) {
      return NextResponse.json(
        { success: false, error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: producto,
    });
  } catch (error) {
    console.error("Error al obtener producto:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener producto",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["admin", "super_admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const productoActualizado = await updateProducto(id, body);

    return NextResponse.json({
      success: true,
      data: productoActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar producto",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH — Acciones ligeras que vendedores también pueden ejecutar.
 * action: "generar_codigo" → asigna codigoBarras si el producto no tiene uno aún.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["admin", "vendedor", "super_admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();

    if (body.action === "generar_codigo") {
      const supabase = createAdminClient();

      // Verificar que el producto existe y no tiene código ya
      const { data: prod } = await supabase
        .from("productos")
        .select("id, codigo_barras, sku")
        .eq("id", id)
        .single();

      if (!prod) {
        return NextResponse.json({ success: false, error: "Producto no encontrado" }, { status: 404 });
      }

      // Si ya tiene código, devolver el existente sin modificar
      if (prod.codigo_barras || prod.sku) {
        return NextResponse.json({ success: true, codigo: prod.codigo_barras || prod.sku, generado: false });
      }

      // Generar código único CP-XXXXXX (sin caracteres confundibles 0/O, 1/I)
      const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let codigo: string;
      let intentos = 0;
      do {
        const rand = Array.from({ length: 7 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
        codigo = `CP-${rand}`;
        intentos++;
        // Verificar que no exista ya este código
        const { data: existe } = await supabase
          .from("productos")
          .select("id")
          .eq("codigo_barras", codigo)
          .maybeSingle();
        if (!existe) break;
      } while (intentos < 10);

      // Guardar en el producto
      const { error } = await supabase
        .from("productos")
        .update({ codigo_barras: codigo })
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({ success: true, codigo, generado: true });
    }

    return NextResponse.json({ success: false, error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("Error en PATCH /api/productos/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["admin", "super_admin"]);
    if (!auth.ok) return auth.response;

    const { id } = await params;

    await deleteProducto(id);

    return NextResponse.json({
      success: true,
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error al eliminar producto",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
