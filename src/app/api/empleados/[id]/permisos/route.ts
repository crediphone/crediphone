/**
 * FASE 56: API de Permisos Granulares por Empleado
 *
 * GET  /api/empleados/[id]/permisos  → devuelve mapa de permisos del empleado
 * PUT  /api/empleados/[id]/permisos  → reemplaza todos los permisos del empleado
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext }          from "@/lib/auth/server";
import { getPermisosEmpleado, setPermisosEmpleado } from "@/lib/db/permisos";
import { createAdminClient }       from "@/lib/supabase/admin";
import { tienePermiso }            from "@/lib/permisos";
import type { MapaPermisos }       from "@/types";

// ─── GET /api/empleados/[id]/permisos ────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin, permisosExplicitos } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    // Solo admin o super_admin pueden ver permisos de otros empleados
    const puedeVer = isSuperAdmin || tienePermiso(role, permisosExplicitos, "empleado_ver");
    if (!puedeVer) return NextResponse.json({ success: false, error: "Sin permisos" }, { status: 403 });

    const { id: empleadoId } = await params;

    // Verificar que el empleado pertenece al mismo distribuidor (si no es super_admin)
    if (!isSuperAdmin) {
      const supabase = createAdminClient();
      const { data: emp } = await supabase
        .from("users")
        .select("distribuidor_id")
        .eq("id", empleadoId)
        .single();

      if (!emp || emp.distribuidor_id !== distribuidorId) {
        return NextResponse.json({ success: false, error: "Empleado no encontrado" }, { status: 404 });
      }
    }

    const mapa = await getPermisosEmpleado(empleadoId);
    return NextResponse.json({ success: true, data: mapa });
  } catch (err) {
    console.error("[permisos GET]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

// ─── PUT /api/empleados/[id]/permisos ────────────────────────────────────────
// Body: { permisos: { [permiso]: boolean } }
// Reemplaza TODOS los permisos explícitos del empleado.

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, role, distribuidorId, isSuperAdmin, permisosExplicitos } = await getAuthContext();
    if (!userId) return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });

    // Solo admin o super_admin pueden editar permisos
    const puedeEditar = isSuperAdmin || tienePermiso(role, permisosExplicitos, "empleado_editar");
    if (!puedeEditar) return NextResponse.json({ success: false, error: "Sin permisos" }, { status: 403 });

    const { id: empleadoId } = await params;

    // Verificar que el empleado pertenece al mismo distribuidor
    if (!isSuperAdmin) {
      const supabase = createAdminClient();
      const { data: emp } = await supabase
        .from("users")
        .select("distribuidor_id, role")
        .eq("id", empleadoId)
        .single();

      if (!emp || emp.distribuidor_id !== distribuidorId) {
        return NextResponse.json({ success: false, error: "Empleado no encontrado" }, { status: 404 });
      }

      // Un admin no puede editar permisos de otro admin ni de super_admin
      if (emp.role === "super_admin" || emp.role === "admin") {
        return NextResponse.json({ success: false, error: "No se pueden editar permisos de admin" }, { status: 403 });
      }
    }

    const body = await req.json() as { permisos: MapaPermisos };
    if (!body?.permisos || typeof body.permisos !== "object") {
      return NextResponse.json({ success: false, error: "Body inválido: se espera { permisos: {} }" }, { status: 400 });
    }

    // Filtrar solo booleanos válidos
    const mapaLimpio: MapaPermisos = {};
    for (const [k, v] of Object.entries(body.permisos)) {
      if (typeof v === "boolean") mapaLimpio[k] = v;
    }

    await setPermisosEmpleado(empleadoId, mapaLimpio, userId);
    return NextResponse.json({ success: true, data: mapaLimpio });
  } catch (err) {
    console.error("[permisos PUT]", err);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
