import { NextResponse } from "next/server";
import { getAuthContext } from "./server";
import type { UserRole } from "@/types";

/**
 * Resultado de requireAuth.
 * Si ok = true  → el handler puede continuar con los datos del usuario.
 * Si ok = false → el handler debe retornar `auth.response` inmediatamente.
 */
export type AuthOk = {
  ok: true;
  userId: string;
  role: UserRole;
  distribuidorId: string | null;
  isSuperAdmin: boolean;
};

export type AuthFail = {
  ok: false;
  response: NextResponse;
};

export type AuthResult = AuthOk | AuthFail;

/**
 * Guard de autenticación/autorización para API routes.
 *
 * Uso básico (solo verificar que está logueado):
 *   const auth = await requireAuth();
 *   if (!auth.ok) return auth.response;
 *
 * Uso con roles permitidos:
 *   const auth = await requireAuth(["admin", "super_admin"]);
 *   if (!auth.ok) return auth.response;
 *
 * @param allowedRoles - Lista de roles que pueden acceder.
 *                       Si se omite o es vacío, cualquier usuario autenticado puede pasar.
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<AuthResult> {
  const ctx = await getAuthContext();

  if (!ctx.userId) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      ),
    };
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(ctx.role as UserRole)
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "No autorizado para esta acción" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    userId: ctx.userId,
    role: ctx.role as UserRole,
    distribuidorId: ctx.distribuidorId,
    isSuperAdmin: ctx.isSuperAdmin,
  };
}
