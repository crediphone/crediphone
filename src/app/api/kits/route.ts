import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { getKits, createKit } from "@/lib/db/kits";

export async function GET(request: NextRequest) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    let efectivoDistribuidorId = distribuidorId ?? null;
    if (role === "super_admin") {
      const h = request.headers.get("X-Distribuidor-Id");
      if (h) efectivoDistribuidorId = h;
    }
    if (!efectivoDistribuidorId) return NextResponse.json({ success: true, data: [] });

    const soloActivos = request.nextUrl.searchParams.get("activos") === "true";
    const kits = await getKits(efectivoDistribuidorId, soloActivos);
    return NextResponse.json({ success: true, data: kits });
  } catch (error) {
    console.error("GET /api/kits:", error);
    return NextResponse.json({ success: false, error: "Error al obtener kits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!["admin", "super_admin"].includes(role ?? ""))
      return NextResponse.json({ success: false, error: "Sin permisos" }, { status: 403 });

    let efectivoDistribuidorId = distribuidorId ?? null;
    if (role === "super_admin") {
      const h = request.headers.get("X-Distribuidor-Id");
      if (h) efectivoDistribuidorId = h;
    }
    if (!efectivoDistribuidorId)
      return NextResponse.json({ success: false, error: "Distribuidor requerido" }, { status: 400 });

    const body = await request.json();
    if (!body.nombre?.trim())
      return NextResponse.json({ success: false, error: "El nombre es requerido" }, { status: 400 });
    if (!Array.isArray(body.items) || body.items.length < 2)
      return NextResponse.json({ success: false, error: "Un kit debe tener al menos 2 productos" }, { status: 400 });

    const kit = await createKit(efectivoDistribuidorId, {
      nombre:       body.nombre.trim(),
      descripcion:  body.descripcion ?? undefined,
      precio:       Number(body.precio) || 0,
      imagen:       body.imagen ?? undefined,
      items:        body.items,
    });
    return NextResponse.json({ success: true, data: kit }, { status: 201 });
  } catch (error) {
    console.error("POST /api/kits:", error);
    return NextResponse.json({ success: false, error: "Error al crear kit" }, { status: 500 });
  }
}
