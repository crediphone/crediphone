import { createAdminClient } from "@/lib/supabase/admin";
import type { Cliente } from "@/types";

export async function getClientes(distribuidorId?: string): Promise<Cliente[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  if (distribuidorId) {
    query = query.eq("distribuidor_id", distribuidorId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Cliente[];
}

export async function getClienteById(id: string, distribuidorId?: string): Promise<Cliente | null> {
  const supabase = createAdminClient();
  let query = supabase
    .from("clientes")
    .select("*")
    .eq("id", id);

  if (distribuidorId) {
    query = query.eq("distribuidor_id", distribuidorId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data as Cliente;
}

export async function createCliente(cliente: Omit<Cliente, "id" | "createdAt" | "updatedAt">): Promise<Cliente> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      distribuidor_id: cliente.distribuidorId, // FASE 21
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      curp: cliente.curp,
      ine: cliente.ine,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Cliente;
}

export async function updateCliente(id: string, cliente: Partial<Cliente>, distribuidorId?: string): Promise<Cliente> {
  const supabase = createAdminClient();
  let query = supabase
    .from("clientes")
    .update(cliente)
    .eq("id", id);

  if (distribuidorId) {
    query = query.eq("distribuidor_id", distribuidorId);
  }

  const { data, error } = await query
    .select()
    .single();

  if (error) throw error;
  return data as Cliente;
}

export async function deleteCliente(id: string, distribuidorId?: string): Promise<void> {
  const supabase = createAdminClient();
  let query = supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (distribuidorId) {
    query = query.eq("distribuidor_id", distribuidorId);
  }

  const { error } = await query;

  if (error) throw error;
}

export async function searchClientes(query: string, distribuidorId?: string): Promise<Cliente[]> {
  const supabase = createAdminClient();
  let dbQuery = supabase
    .from("clientes")
    .select("*")
    .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,telefono.ilike.%${query}%,curp.ilike.%${query}%`)
    .order("created_at", { ascending: false });

  if (distribuidorId) {
    dbQuery = dbQuery.eq("distribuidor_id", distribuidorId);
  }

  const { data, error } = await dbQuery;

  if (error) throw error;
  return data as Cliente[];
}
