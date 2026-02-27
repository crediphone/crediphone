import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para operaciones del servidor
 * Usa SERVICE_ROLE_KEY para bypassear RLS
 * ⚠️ SOLO usar en rutas API del servidor, NUNCA en el cliente
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
  );
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
