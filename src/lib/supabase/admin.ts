import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para operaciones del servidor (Admin)
 *
 * Este cliente usa la Service Role Key que bypasea Row Level Security (RLS).
 * SOLO debe usarse en el servidor (API Routes, Server Components) nunca en el cliente.
 *
 * Uso: Para operaciones CRUD desde APIs que no requieren autenticación de usuario.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
