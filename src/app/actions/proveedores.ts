"use server";

import { createProveedor, updateProveedor } from "@/lib/db/proveedores";
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

export async function createProveedorAction(formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const contacto = (formData.get("contacto") as string) || undefined;
  const telefono = (formData.get("telefono") as string) || undefined;
  const email = (formData.get("email") as string) || undefined;
  const rfc = (formData.get("rfc") as string) || undefined;
  const direccion = (formData.get("direccion") as string) || undefined;
  const notas = (formData.get("notas") as string) || undefined;

  try {
    const distribuidorId = await resolveDistribuidorId();

    await createProveedor({
      distribuidorId,
      nombre,
      contacto,
      telefono,
      email,
      rfc,
      direccion,
      notas,
    });

    revalidatePath("/dashboard/admin/proveedores");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { error: message };
  }

  redirect("/dashboard/admin/proveedores");
}

export async function updateProveedorAction(id: string, formData: FormData) {
  const nombre = formData.get("nombre") as string;
  const contacto = (formData.get("contacto") as string) || undefined;
  const telefono = (formData.get("telefono") as string) || undefined;
  const email = (formData.get("email") as string) || undefined;
  const rfc = (formData.get("rfc") as string) || undefined;
  const direccion = (formData.get("direccion") as string) || undefined;
  const notas = (formData.get("notas") as string) || undefined;

  try {
    const distribuidorId = await resolveDistribuidorId();

    await updateProveedor(id, {
      nombre,
      contacto,
      telefono,
      email,
      rfc,
      direccion,
      notas,
    }, distribuidorId);

    revalidatePath("/dashboard/admin/proveedores");
    revalidatePath(`/dashboard/admin/proveedores/${id}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return { error: message };
  }

  redirect("/dashboard/admin/proveedores");
}
