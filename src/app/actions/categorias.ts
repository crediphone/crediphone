"use server";

import { createCategoria, updateCategoria } from "@/lib/db/categorias";
import { getDistribuidorId } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function resolveDistribuidorId(): Promise<string> {
  let distribuidorId = await getDistribuidorId();

  if (!distribuidorId) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("distribuidores")
      .select("id")
      .eq("slug", "default")
      .single();
    if (data) distribuidorId = data.id;
  }

  if (!distribuidorId) {
    throw new Error("No se encontró distribuidor activo");
  }

  return distribuidorId;
}

export async function createCategoriaAction(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const descripcion = (formData.get("descripcion") as string) || undefined;

  try {
    const distribuidorId = await resolveDistribuidorId();

    await createCategoria({
      distribuidorId,
      nombre,
      descripcion,
    });

    revalidatePath("/dashboard/admin/categorias");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { error: message };
  }

  redirect("/dashboard/admin/categorias");
}

export async function updateCategoriaAction(id: string, formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const descripcion = (formData.get("descripcion") as string) || undefined;

  try {
    const distribuidorId = await resolveDistribuidorId();

    await updateCategoria(id, { nombre, descripcion }, distribuidorId);

    revalidatePath("/dashboard/admin/categorias");
    revalidatePath(`/dashboard/admin/categorias/${id}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { error: message };
  }

  redirect("/dashboard/admin/categorias");
}
