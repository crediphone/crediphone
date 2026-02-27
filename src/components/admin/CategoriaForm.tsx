"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createCategoriaAction, updateCategoriaAction } from "@/app/actions/categorias";
import type { Categoria } from "@/types";

interface CategoriaFormProps {
  initialData?: Categoria;
  isEdit?: boolean;
}

export default function CategoriaForm({ initialData, isEdit = false }: CategoriaFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    let result;
    if (isEdit && initialData) {
      result = await updateCategoriaAction(initialData.id, formData);
    } else {
      result = await createCategoriaAction(formData);
    }

    if (result && result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {isEdit ? "Editar Categoría" : "Nueva Categoría"}
      </h2>

      <form action={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre de la Categoría *
          </label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={initialData?.nombre}
            required
            placeholder="Ej: Celulares, Accesorios, Fundas..."
          />
        </div>

        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción (Opcional)
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            defaultValue={initialData?.descripcion}
            placeholder="Describe brevemente esta categoría..."
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
            {loading ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear Categoría"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
