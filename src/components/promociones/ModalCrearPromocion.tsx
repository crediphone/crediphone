"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import type { Promocion } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promo?: Promocion | null;
}

const CATEGORIAS = [
  { value: "accesorios", label: "Accesorios" },
  { value: "combos",     label: "Combos" },
  { value: "celulares",  label: "Celulares" },
  { value: "servicios",  label: "Servicios" },
  { value: "general",    label: "General" },
];

export function ModalCrearPromocion({ isOpen, onClose, onSuccess, promo }: Props) {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    imagenUrl: "",
    precioNormal: "",
    precioPromocion: "",
    categoria: "general",
    fechaInicio: "",
    fechaFin: "",
    activa: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (promo) {
      setForm({
        titulo: promo.titulo,
        descripcion: promo.descripcion ?? "",
        imagenUrl: promo.imagenUrl ?? "",
        precioNormal: promo.precioNormal?.toString() ?? "",
        precioPromocion: promo.precioPromocion?.toString() ?? "",
        categoria: promo.categoria,
        fechaInicio: promo.fechaInicio ? new Date(promo.fechaInicio).toISOString().split("T")[0] : "",
        fechaFin: promo.fechaFin ? new Date(promo.fechaFin).toISOString().split("T")[0] : "",
        activa: promo.activa,
      });
    } else {
      setForm({ titulo: "", descripcion: "", imagenUrl: "", precioNormal: "", precioPromocion: "", categoria: "general", fechaInicio: "", fechaFin: "", activa: true });
    }
    setError("");
  }, [promo, isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, categoria: e.target.value });
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { setError("El título es requerido"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        imagenUrl: form.imagenUrl.trim() || undefined,
        precioNormal: form.precioNormal ? parseFloat(form.precioNormal) : undefined,
        precioPromocion: form.precioPromocion ? parseFloat(form.precioPromocion) : undefined,
        categoria: form.categoria,
        fechaInicio: form.fechaInicio || undefined,
        fechaFin: form.fechaFin || undefined,
        activa: form.activa,
      };
      const res = await fetch(promo ? `/api/promociones/${promo.id}` : "/api/promociones", {
        method: promo ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={promo ? "Editar Promoción" : "Nueva Promoción"} size="md">
      <div className="space-y-4">
        <Input label="Título *" name="titulo" value={form.titulo} onChange={handleInputChange} placeholder="Ej: Pantalla iPhone 13 Pro — oferta especial" />
        <Textarea label="Descripción" name="descripcion" value={form.descripcion} onChange={handleInputChange} placeholder="Detalles de la promoción..." rows={3} />
        <Input label="URL de imagen" name="imagenUrl" value={form.imagenUrl} onChange={handleInputChange} placeholder="https://..." />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Precio normal ($)" type="number" name="precioNormal" value={form.precioNormal} onChange={handleInputChange} placeholder="800" />
          <Input label="Precio promo ($)" type="number" name="precioPromocion" value={form.precioPromocion} onChange={handleInputChange} placeholder="650" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>Categoría</label>
          <select
            value={form.categoria}
            onChange={handleSelectChange}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--color-bg-sunken)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          >
            {CATEGORIAS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Fecha inicio" type="date" name="fechaInicio" value={form.fechaInicio} onChange={handleInputChange} />
          <Input label="Fecha fin" type="date" name="fechaFin" value={form.fechaFin} onChange={handleInputChange} />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="activa" name="activa" checked={form.activa} onChange={handleInputChange} className="w-4 h-4" />
          <label htmlFor="activa" className="text-sm" style={{ color: "var(--color-text-primary)" }}>Promoción activa</label>
        </div>
        {error && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Guardando..." : promo ? "Guardar cambios" : "Crear promoción"}</Button>
        </div>
      </div>
    </Modal>
  );
}
