"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createProveedorAction, updateProveedorAction } from "@/app/actions/proveedores";
import type { Proveedor } from "@/types";

interface ProveedorFormProps {
  initialData?: Proveedor;
  isEdit?: boolean;
}

export default function ProveedorForm({ initialData, isEdit = false }: ProveedorFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    let result;
    if (isEdit && initialData) {
      result = await updateProveedorAction(initialData.id, formData);
    } else {
      result = await createProveedorAction(formData);
    }

    if (result && result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {isEdit ? "Editar Proveedor" : "Nuevo Proveedor"}
      </h2>

      <form action={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del Proveedor *
          </label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={initialData?.nombre}
            required
            placeholder="Ej: Distribuidora Samsung México"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contacto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contacto
            </label>
            <Input
              id="contacto"
              name="contacto"
              defaultValue={initialData?.contacto}
              placeholder="Nombre del contacto"
            />
          </div>

          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teléfono
            </label>
            <Input
              id="telefono"
              name="telefono"
              defaultValue={initialData?.telefono}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialData?.email}
              placeholder="proveedor@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="rfc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              RFC
            </label>
            <Input
              id="rfc"
              name="rfc"
              defaultValue={initialData?.rfc}
              placeholder="XAXX010101000"
              maxLength={13}
            />
          </div>
        </div>

        <div>
          <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dirección
          </label>
          <Input
            id="direccion"
            name="direccion"
            defaultValue={initialData?.direccion}
            placeholder="Calle, colonia, ciudad..."
          />
        </div>

        <div>
          <label htmlFor="notas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas
          </label>
          <textarea
            id="notas"
            name="notas"
            defaultValue={initialData?.notas}
            placeholder="Notas adicionales sobre el proveedor..."
            rows={3}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear Proveedor"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
