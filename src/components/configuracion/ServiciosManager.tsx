"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Wrench, Phone, FileText, Stethoscope, Tag, X, Check,
  DollarSign, AlertCircle, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import type { Servicio, CategoriaServicio, ServicioFormData, CategoriaServicioConfig } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Ícono por value de categoría */
function getCategoriaIcon(value: string): React.ReactNode {
  switch (value) {
    case "telefonia":   return <Phone className="w-4 h-4" />;
    case "papeleria":   return <FileText className="w-4 h-4" />;
    case "diagnostico": return <Stethoscope className="w-4 h-4" />;
    case "reparacion":  return <Wrench className="w-4 h-4" />;
    default:            return <Tag className="w-4 h-4" />;
  }
}

function fmtPrecio(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

// ─── Modal Gestionar Categorías ───────────────────────────────────────────────

interface ModalCategoriasProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: CategoriaServicioConfig[];
  onAdd: (label: string) => Promise<void>;
  onDelete: (value: string) => Promise<void>;
}

const DEFAULTS_VALUES = ["telefonia", "papeleria", "diagnostico", "reparacion", "otro"];

function ModalCategorias({ isOpen, onClose, categorias, onAdd, onDelete }: ModalCategoriasProps) {
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewLabel("");
      setError("");
    }
  }, [isOpen]);

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) { setError("Escribe un nombre para la categoría"); return; }
    setSaving(true);
    setError("");
    try {
      await onAdd(label);
      setNewLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar categoría");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (value: string) => {
    setDeleting(value);
    try {
      await onDelete(value);
    } finally {
      setDeleting(null);
    }
  };

  const custom = categorias.filter((c) => !DEFAULTS_VALUES.includes(c.value));
  const defaults = categorias.filter((c) => DEFAULTS_VALUES.includes(c.value));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar categorías" size="sm">
      <div className="space-y-4">
        {/* Categorías predeterminadas — solo lectura */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
            PREDETERMINADAS (no se pueden eliminar)
          </p>
          <div className="flex flex-wrap gap-2">
            {defaults.map((cat) => (
              <span
                key={cat.value}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: "var(--color-bg-elevated)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                {getCategoriaIcon(cat.value)}
                {cat.label}
              </span>
            ))}
          </div>
        </div>

        {/* Categorías personalizadas */}
        {custom.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>
              PERSONALIZADAS
            </p>
            <div className="flex flex-wrap gap-2">
              {custom.map((cat) => (
                <span
                  key={cat.value}
                  className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--color-accent-light)",
                    color: "var(--color-accent)",
                    border: "1px solid var(--color-accent)",
                  }}
                >
                  <Tag className="w-3.5 h-3.5" />
                  {cat.label}
                  <button
                    onClick={() => handleDelete(cat.value)}
                    disabled={deleting === cat.value}
                    className="ml-1 p-0.5 rounded-full hover:opacity-70 transition-opacity"
                    title="Eliminar"
                  >
                    {deleting === cat.value ? (
                      <span className="w-3 h-3 block animate-spin border border-current border-t-transparent rounded-full" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Agregar nueva */}
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}
        >
          <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Nueva categoría
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => { setNewLabel(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
              placeholder="Ej: Impresión, Recargas Izzi..."
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            />
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={saving || !newLabel.trim()}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              {saving ? "..." : "Agregar"}
            </Button>
          </div>
          {error && (
            <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>
          )}
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            El nombre se convierte automáticamente en identificador único.
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal de Creación/Edición de Servicio ────────────────────────────────────

interface ModalServicioProps {
  isOpen: boolean;
  onClose: () => void;
  servicio: Servicio | null;
  onSave: (data: ServicioFormData) => Promise<void>;
  categorias: CategoriaServicioConfig[];
}

const EMPTY_FORM: ServicioFormData = {
  nombre: "",
  descripcion: "",
  precioBase: 0,
  precioFijo: true,
  precioMin: undefined,
  precioMax: undefined,
  categoria: "otro",
  activo: true,
};

function ModalServicio({ isOpen, onClose, servicio, onSave, categorias }: ModalServicioProps) {
  const [form, setForm] = useState<ServicioFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (servicio) {
        setForm({
          nombre: servicio.nombre,
          descripcion: servicio.descripcion ?? "",
          precioBase: servicio.precioBase,
          precioFijo: servicio.precioFijo,
          precioMin: servicio.precioMin,
          precioMax: servicio.precioMax,
          categoria: servicio.categoria,
          activo: servicio.activo,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError("");
    }
  }, [isOpen, servicio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
    if (form.precioBase < 0) { setError("El precio no puede ser negativo"); return; }
    if (!form.precioFijo && form.precioMin != null && form.precioMax != null) {
      if (form.precioMin > form.precioMax) {
        setError("El precio mínimo no puede ser mayor al máximo");
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof ServicioFormData, val: unknown) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={servicio ? "Editar servicio" : "Nuevo servicio"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <Input
          label="Nombre del servicio *"
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Ej: Recarga Telcel, Copia simple, Diagnóstico básico"
        />

        {/* Descripción */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Descripción (opcional)
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder="Descripción corta del servicio"
            rows={2}
            className="w-full rounded-md px-3 py-2 text-sm resize-none outline-none"
            style={{
              background: "var(--color-bg-sunken)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {/* Categoría — dinámica */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Categoría
          </label>
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => set("categoria", cat.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background:
                    form.categoria === cat.value
                      ? "var(--color-accent)"
                      : "var(--color-bg-elevated)",
                  color:
                    form.categoria === cat.value
                      ? "var(--color-primary-text)"
                      : "var(--color-text-secondary)",
                  border: `1px solid ${
                    form.categoria === cat.value
                      ? "var(--color-accent)"
                      : "var(--color-border)"
                  }`,
                }}
              >
                {getCategoriaIcon(cat.value)}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Precio fijo / variable */}
        <div
          className="rounded-lg p-3"
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Tipo de precio
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {form.precioFijo
                  ? "Fijo — el empleado no puede modificarlo en POS"
                  : "Variable — el empleado puede ajustar dentro del rango"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => set("precioFijo", !form.precioFijo)}
              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md"
              style={{
                background: form.precioFijo
                  ? "var(--color-success-bg)"
                  : "var(--color-warning-bg)",
                color: form.precioFijo
                  ? "var(--color-success)"
                  : "var(--color-warning)",
                border: `1px solid ${form.precioFijo ? "var(--color-success)" : "var(--color-warning)"}`,
              }}
            >
              {form.precioFijo ? (
                <><ToggleRight className="w-4 h-4" /> Fijo</>
              ) : (
                <><ToggleLeft className="w-4 h-4" /> Variable</>
              )}
            </button>
          </div>

          {/* Precio base */}
          <div className="relative">
            <DollarSign
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              type="number"
              min="0"
              step="0.50"
              value={form.precioBase}
              onChange={(e) => set("precioBase", parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full rounded-md pl-9 pr-3 py-2 text-sm font-mono"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            {form.precioFijo
              ? "Precio que se cobra siempre, sin cambios"
              : "Precio base sugerido (punto de partida del empleado)"}
          </p>

          {/* Rango solo si variable */}
          {!form.precioFijo && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>
                  Precio mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={form.precioMin ?? ""}
                  onChange={(e) =>
                    set("precioMin", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  placeholder="Sin mínimo"
                  className="w-full rounded-md px-3 py-2 text-sm font-mono"
                  style={{
                    background: "var(--color-bg-sunken)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "var(--color-text-muted)" }}>
                  Precio máximo
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={form.precioMax ?? ""}
                  onChange={(e) =>
                    set("precioMax", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  placeholder="Sin máximo"
                  className="w-full rounded-md px-3 py-2 text-sm font-mono"
                  style={{
                    background: "var(--color-bg-sunken)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
            style={{
              background: "var(--color-danger-bg)",
              color: "var(--color-danger)",
              border: "1px solid var(--color-danger)",
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Guardando..." : servicio ? "Guardar cambios" : "Crear servicio"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ServiciosManager() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServicioConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategoriasOpen, setModalCategoriasOpen] = useState(false);
  const [editando, setEditando] = useState<Servicio | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Servicio | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaServicio | "todas">("todas");

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await fetch("/api/servicios/categorias");
      const data = await res.json();
      if (data.success) setCategorias(data.data);
    } catch {
      // silencioso: se usan defaults
    }
  }, []);

  const fetchServicios = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/servicios");
      const data = await res.json();
      if (data.success) setServicios(data.data);
      else setError(data.error ?? "Error al cargar servicios");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
    fetchServicios();
  }, [fetchCategorias, fetchServicios]);

  // ── Categorías: add/delete ──
  const handleAddCategoria = async (label: string) => {
    const res = await fetch("/api/servicios/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Error al agregar categoría");
    await fetchCategorias();
  };

  const handleDeleteCategoria = async (value: string) => {
    const res = await fetch("/api/servicios/categorias", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Error al eliminar categoría");
    // Si el filtro activo era esa categoría, resetear
    if (filtroCategoria === value) setFiltroCategoria("todas");
    await fetchCategorias();
  };

  // ── Servicios: save/toggle/delete ──
  const handleSave = async (form: ServicioFormData) => {
    if (editando) {
      await fetch(`/api/servicios/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    await fetchServicios();
  };

  const handleToggle = async (s: Servicio) => {
    setTogglingId(s.id);
    try {
      await fetch(`/api/servicios/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !s.activo }),
      });
      await fetchServicios();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (s: Servicio) => {
    await fetch(`/api/servicios/${s.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await fetchServicios();
  };

  const getCategoriaLabel = (cat: string) =>
    categorias.find((c) => c.value === cat)?.label ?? cat;

  const serviciosFiltrados =
    filtroCategoria === "todas"
      ? servicios
      : servicios.filter((s) => s.categoria === filtroCategoria);

  // ── Skeleton ──
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg animate-pulse"
            style={{ background: "var(--color-bg-elevated)" }}
          />
        ))}
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div
        className="rounded-lg p-4 flex items-center gap-3"
        style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
      >
        <AlertCircle className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-medium">Error al cargar servicios</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button variant="secondary" onClick={fetchServicios} className="ml-auto">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header de sección */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Servicios sin inventario
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Recargas, copias, diagnósticos y cualquier servicio que no descuenta stock
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* FASE 37b: Botón gestionar categorías */}
          <Button
            variant="secondary"
            onClick={() => setModalCategoriasOpen(true)}
            className="flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Categorías
          </Button>
          <Button
            variant="primary"
            onClick={() => { setEditando(null); setModalOpen(true); }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo servicio
          </Button>
        </div>
      </div>

      {/* Filtros de categoría — dinámicos */}
      <div className="flex flex-wrap gap-2">
        {[{ value: "todas" as const, label: "Todos" }, ...categorias.map((c) => ({ value: c.value, label: c.label }))].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFiltroCategoria(opt.value)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5"
            style={{
              background:
                filtroCategoria === opt.value
                  ? "var(--color-primary)"
                  : "var(--color-bg-elevated)",
              color:
                filtroCategoria === opt.value
                  ? "var(--color-primary-text)"
                  : "var(--color-text-secondary)",
              border: `1px solid ${filtroCategoria === opt.value ? "var(--color-primary)" : "var(--color-border)"}`,
            }}
          >
            {opt.value !== "todas" && getCategoriaIcon(opt.value)}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Lista vacía */}
      {serviciosFiltrados.length === 0 && (
        <div
          className="rounded-lg p-8 text-center"
          style={{ border: "2px dashed var(--color-border)", background: "var(--color-bg-surface)" }}
        >
          <Wrench className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-border-strong)" }} />
          <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>
            {filtroCategoria === "todas"
              ? "Aún no hay servicios"
              : `No hay servicios en "${getCategoriaLabel(filtroCategoria)}"`}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Crea servicios que aparecerán en la sección Servicios del POS
          </p>
          <Button
            variant="secondary"
            onClick={() => { setEditando(null); setModalOpen(true); }}
            className="mt-4 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" /> Crear primer servicio
          </Button>
        </div>
      )}

      {/* Tabla de servicios */}
      {serviciosFiltrados.length > 0 && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--color-border-subtle)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--color-bg-elevated)" }}>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Servicio
                </th>
                <th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell" style={{ color: "var(--color-text-secondary)" }}>
                  Categoría
                </th>
                <th className="text-right px-4 py-2.5 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Precio
                </th>
                <th className="text-center px-4 py-2.5 font-medium hidden md:table-cell" style={{ color: "var(--color-text-secondary)" }}>
                  Tipo
                </th>
                <th className="text-center px-4 py-2.5 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  Estado
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {serviciosFiltrados.map((s, idx) => (
                <tr
                  key={s.id}
                  style={{
                    background: idx % 2 === 0 ? "var(--color-bg-surface)" : "var(--color-bg-elevated)",
                    borderTop: "1px solid var(--color-border-subtle)",
                    opacity: s.activo ? 1 : 0.55,
                  }}
                >
                  {/* Nombre + descripción */}
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {s.nombre}
                    </p>
                    {s.descripcion && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {s.descripcion}
                      </p>
                    )}
                  </td>

                  {/* Categoría */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {getCategoriaIcon(s.categoria)}
                      {getCategoriaLabel(s.categoria)}
                    </span>
                  </td>

                  {/* Precio */}
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {fmtPrecio(s.precioBase)}
                    </span>
                    {!s.precioFijo && (
                      <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--color-text-muted)" }}>
                        {s.precioMin != null ? fmtPrecio(s.precioMin) : "—"} –{" "}
                        {s.precioMax != null ? fmtPrecio(s.precioMax) : "—"}
                      </p>
                    )}
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <Badge variant={s.precioFijo ? "default" : "warning"}>
                      {s.precioFijo ? "Fijo" : "Variable"}
                    </Badge>
                  </td>

                  {/* Activo toggle */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(s)}
                      disabled={togglingId === s.id}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-all"
                      title={s.activo ? "Desactivar" : "Activar"}
                      style={{
                        background: s.activo ? "var(--color-success-bg)" : "var(--color-bg-elevated)",
                        color: s.activo ? "var(--color-success)" : "var(--color-text-muted)",
                      }}
                    >
                      {s.activo ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => { setEditando(s); setModalOpen(true); }}
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s)}
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: "var(--color-danger)" }}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar servicio */}
      <ModalServicio
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditando(null); }}
        servicio={editando}
        onSave={handleSave}
        categorias={categorias}
      />

      {/* Modal gestionar categorías */}
      <ModalCategorias
        isOpen={modalCategoriasOpen}
        onClose={() => setModalCategoriasOpen(false)}
        categorias={categorias}
        onAdd={handleAddCategoria}
        onDelete={handleDeleteCategoria}
      />

      {/* Modal confirmar eliminación de servicio */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar servicio"
        size="sm"
      >
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          ¿Seguro que quieres eliminar{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>
            {confirmDelete?.nombre}
          </strong>
          ? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
