import { getProveedorById } from "@/lib/db/proveedores";
import ProveedorForm from "@/components/admin/ProveedorForm";
import { notFound } from "next/navigation";

export default async function EditProveedorPage({
  params,
}: {
  params: { id: string };
}) {
  const proveedor = await getProveedorById(params.id);

  if (!proveedor) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <ProveedorForm initialData={proveedor} isEdit={true} />
    </div>
  );
}
