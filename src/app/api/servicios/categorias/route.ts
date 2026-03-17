import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CategoriaServicioConfig } from "@/types";

/**
 * Categorías de servicios por defecto (siempre presentes).
 * No se pueden eliminar.
 */
const DEFAULTS: CategoriaServicioConfig[] = [
  { value: "telefonia",  label: "Telefonía" },
  { value: "papeleria",  label: "Papelería" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "reparacion", label: "Reparación" },
  { value: "otro",       label: "Otro" },
];

/**
 * GET /api/servicios/categorias
 * Devuelve las categorías del distribuidor: defaults + personalizadas.
 */
export async function GET() {
  try {
    const { userId, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    const supabase = createAdminClient();

    const filterDistribuidorId = isSuperAdmin ? null : distribuidorId;

    let query = supabase
      .from("configuracion")
      .select("categorias_servicios");

    if (filterDistribuidorId) {
      query = query.eq("distribuidor_id", filterDistribuidorId);
    }

    const { data } = await query.limit(1).single();

    const custom: CategoriaServicioConfig[] = Array.isArray(data?.categorias_servicios)
      ? (data.categorias_servicios as CategoriaServicioConfig[])
      : [];

    // Combinar: defaults + personalizadas (sin duplicar values)
    const defaultValues = new Set(DEFAULTS.map((d) => d.value));
    const extras = custom.filter((c) => !defaultValues.has(c.value));

    return NextResponse.json({
      success: true,
      data: [...DEFAULTS, ...extras],
      custom: extras,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al obtener categorías", message: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/servicios/categorias
 * Agrega una nueva categoría personalizada.
 * Body: { label: string }
 * Roles: admin, super_admin
 */
export async function POST(request: Request) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!role || !["admin", "super_admin"].includes(role)) {
      return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
    }

    const body = await request.json();
    const label = (body.label as string)?.trim();
    if (!label) {
      return NextResponse.json({ success: false, error: "El nombre de la categoría es requerido" }, { status: 400 });
    }

    // Generar un valor (slug) a partir del label
    const value = label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quitar acentos
      .replace(/[^a-z0-9]+/g, "-")     // no alfanuméricos → guión
      .replace(/^-|-$/g, "");           // trim guiones

    if (!value) {
      return NextResponse.json({ success: false, error: "Nombre inválido" }, { status: 400 });
    }

    // Verificar que no exista ya (defaults + custom)
    const allDefaults = ["telefonia", "papeleria", "diagnostico", "reparacion", "otro"];
    if (allDefaults.includes(value)) {
      return NextResponse.json({ success: false, error: "Esta categoría ya existe" }, { status: 409 });
    }

    const supabase = createAdminClient();
    const filterDistribuidorId = isSuperAdmin ? null : distribuidorId;

    let query = supabase
      .from("configuracion")
      .select("id, categorias_servicios");

    if (filterDistribuidorId) {
      query = query.eq("distribuidor_id", filterDistribuidorId);
    }

    const { data: config } = await query.limit(1).single();
    if (!config) {
      return NextResponse.json({ success: false, error: "Configuración no encontrada" }, { status: 404 });
    }

    const current: CategoriaServicioConfig[] = Array.isArray(config.categorias_servicios)
      ? (config.categorias_servicios as CategoriaServicioConfig[])
      : [];

    // Verificar duplicado en custom
    if (current.some((c) => c.value === value)) {
      return NextResponse.json({ success: false, error: "Esta categoría ya existe" }, { status: 409 });
    }

    const nueva: CategoriaServicioConfig = { value, label };
    const updated = [...current, nueva];

    await supabase
      .from("configuracion")
      .update({ categorias_servicios: updated })
      .eq("id", config.id);

    return NextResponse.json({ success: true, data: nueva });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al crear categoría", message: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/servicios/categorias
 * Elimina una categoría personalizada por value.
 * Body: { value: string }
 * Roles: admin, super_admin
 * NOTA: no se pueden eliminar las categorías por defecto.
 */
export async function DELETE(request: Request) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    if (!role || !["admin", "super_admin"].includes(role)) {
      return NextResponse.json({ success: false, error: "Sin permiso" }, { status: 403 });
    }

    const body = await request.json();
    const value = (body.value as string)?.trim();
    if (!value) {
      return NextResponse.json({ success: false, error: "El value es requerido" }, { status: 400 });
    }

    // No permitir eliminar defaults
    const allDefaults = ["telefonia", "papeleria", "diagnostico", "reparacion", "otro"];
    if (allDefaults.includes(value)) {
      return NextResponse.json(
        { success: false, error: "No se pueden eliminar las categorías predeterminadas" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const filterDistribuidorId = isSuperAdmin ? null : distribuidorId;

    let query = supabase
      .from("configuracion")
      .select("id, categorias_servicios");

    if (filterDistribuidorId) {
      query = query.eq("distribuidor_id", filterDistribuidorId);
    }

    const { data: config } = await query.limit(1).single();
    if (!config) {
      return NextResponse.json({ success: false, error: "Configuración no encontrada" }, { status: 404 });
    }

    const current: CategoriaServicioConfig[] = Array.isArray(config.categorias_servicios)
      ? (config.categorias_servicios as CategoriaServicioConfig[])
      : [];

    const updated = current.filter((c) => c.value !== value);

    await supabase
      .from("configuracion")
      .update({ categorias_servicios: updated })
      .eq("id", config.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al eliminar categoría", message: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}
