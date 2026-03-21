"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  Plus,
  Wrench,
  Pencil,
  Trash2,
  Search,
  Check,
  X,
  Clock,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { CatalogoServicioReparacion, CatalogoServicioFormData } from "@/types";

// ─────────────────────────────────────────────────────────────
// Tipos locales
// ─────────────────────────────────────────────────────────────

interface FormState {
  nombre: string;
  descripcion: string;
  marca: string;
  modelo: string;
  precioBase: string;
  tiempoEstimadoMinutos: string;
  activo: boolean;
}

const FORM_INICIAL: FormState = {
  nombre: "",
  descripcion: "",
  marca: "",
  modelo: "",
  precioBase: "",
  tiempoEstimadoMinutos: "",
  activo: true,
};

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────

export default function CatalogoReparacionesPage() {
  const { user } = useAuth();
  const [servicios, setServicios] = useState<CatalogoServicioReparacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [servicioEditando, setServicioEditando] =
    useState<CatalogoServicioReparacion | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [confirmEliminar, setConfirmEliminar] =
    useState<CatalogoServicioReparacion | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // ── Redirect si no tiene rol ──────────────────────────────
  useEffect(() => {
    if (user && !["admin", "super_admin"].includes(user.role)) {
      window.location.href = "/dashboard";
    }
  }, [user]);

  // ── Cargar servicios ──────────────────────────────────────
  const cargarServicios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/catalogo-servicios?incluirInactivos=true");
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setServicios(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  // ── Filtro de búsqueda ───────────────────────────────────
  const serviciosFiltrados = servicios.filter((s) => {
    const q = busqueda.toLowerCase();
    return (
      s.nombre.toLowerCase().includes(q) ||
      (s.marca || "").toLowerCase().includes(q) ||
      (s.modelo || "").toLowerCase().includes(q)
    );
  });

  // ── Helpers modal ────────────────────────────────────────
  const abrirCrear = () => {
    setServicioEditando(null);
    setForm(FORM_INICIAL);
    setErrorForm(null);
    setMostrarModal(true);
  };

  const abrirEditar = (s: CatalogoServicioReparacion) => {
    setServicioEditando(s);
    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion || "",
      marca: s.marca || "",
      modelo: s.modelo || "",
      precioBase: String(s.precioBase),
      tiempoEstimadoMinutos: s.tiempoEstimadoMinutos
        ? String(s.tiempoEstimadoMinutos)
        : "",
      activo: s.activo,
    });
    setErrorForm(null);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setServicioEditando(null);
    setForm(FORM_INICIAL);
    setErrorForm(null);
  };

  // ── Guardar ──────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      setErrorForm("El nombre del servicio es requerido");
      return;
    }
    if (!form.precioBase || isNaN(Number(form.precioBase))) {
      setErrorForm("El precio base debe ser un número válido");
      return;
    }

    try {
      setGuardando(true);
      setErrorForm(null);

      const payload: CatalogoServicioFormData = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        marca: form.marca.trim() || undefined,
        modelo: form.modelo.trim() || undefined,
        precioBase: Number(form.precioBase),
        tiempoEstimadoMinutos: form.tiempoEstimadoMinutos
          ? Number(form.tiempoEstimadoMinutos)
          : undefined,
        activo: form.activo,
      };

      let res: Response;

      if (servicioEditando) {
        res = await fetch(`/api/catalogo-servicios/${servicioEditando.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/catalogo-servicios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      await cargarServicios();
      cerrarModal();
    } catch (err) {
      setErrorForm(
        err instanceof Error ? err.message : "Error al guardar servicio"
      );
    } finally {
      setGuardando(false);
    }
  };

  // ── Eliminar ─────────────────────────────────────────────
  const handleEliminar = async () => {
    if (!confirmEliminar) return;
    try {
      setEliminando(true);
      const res = await fetch(`/api/catalogo-servicios/${confirmEliminar.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await cargarServicios();
      setConfirmEliminar(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar servicio");
    } finally {
      setEliminando(false);
    }
  };

  // ── Toggle activo ────────────────────────────────────────
  const handleToggleActivo = async (s: CatalogoServicioReparacion) => {
    try {
      const res = await fetch(`/api/catalogo-servicios/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !s.activo }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await cargarServicios();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  // ── Render: estados ──────────────────────────────────────
  if (!user || !["admin", "super_admin"].includes(user.role)) return null;

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-ui)" }}
          >
            <Wrench
              className="w-8 h-8"
              style={{ color: "var(--color-accent)" }}
            />
            Catálogo de Reparaciones
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Servicios estándar con precios base para todo el taller
          </p>
        </div>
        <Button onClick={abrirCrear}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6 max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--color-text-muted)" }}
        />
        <input
          type="text"
          placeholder="Buscar por nombre, marca o modelo…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none transition-all"
          style={{
            backgroundColor: "var(--color-bg-sunken)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* Estado: loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border animate-pulse h-32"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                borderColor: "var(--color-border-subtle)",
              }}
            />
          ))}
        </div>
      )}

      {/* Estado: error */}
      {!loading && error && (
        <div
          className="rounded-xl border p-6 text-center"
          style={{
            backgroundColor: "var(--color-danger-bg)",
            borderColor: "var(--color-danger)",
          }}
        >
          <p style={{ color: "var(--color-danger-text)" }}>{error}</p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={cargarServicios}
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Estado: vacío */}
      {!loading && !error && serviciosFiltrados.length === 0 && (
        <div
          className="rounded-xl border p-12 text-center"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <Wrench
            className="w-12 h-12 mx-auto mb-4 opacity-30"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p
            className="text-lg font-semibold"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {busqueda ? "No hay servicios que coincidan" : "Catálogo vacío"}
          </p>
          <p
            className="text-sm mt-1 mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            {busqueda
              ? "Intenta con otro término de búsqueda"
              : "Crea el primer servicio para empezar"}
          </p>
          {!busqueda && (
            <Button onClick={abrirCrear}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Servicio
            </Button>
          )}
        </div>
      )}

      {/* Grid de servicios */}
      {!loading && !error && serviciosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviciosFiltrados.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border p-5 flex flex-col gap-3 transition-all hover:-translate-y-px"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                borderColor: "var(--color-border-subtle)",
                boxShadow: "var(--shadow-sm)",
                opacity: s.activo ? 1 : 0.6,
              }}
            >
              {/* Cabecera */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm leading-tight truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {s.nombre}
                  </p>
                  {(s.marca || s.modelo) && (
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {[s.marca, s.modelo].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <Badge variant={s.activo ? "success" : "default"}>
                  {s.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              {/* Descripción */}
              {s.descripcion && (
                <p
                  className="text-xs line-clamp-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {s.descripcion}
                </p>
              )}

              {/* Datos */}
              <div className="flex items-center gap-4 mt-auto">
                <span
                  className="flex items-center gap-1 text-base font-semibold"
                  style={{
                    fontFamily: "var(--font-data)",
                    color: "var(--color-accent)",
                  }}
                >
                  <DollarSign className="w-4 h-4" />
                  {Number(s.precioBase).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                {s.tiempoEstimadoMinutos && (
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <Clock className="w-3 h-3" />
                    {s.tiempoEstimadoMinutos < 60
                      ? `${s.tiempoEstimadoMinutos} min`
                      : `${Math.round(s.tiempoEstimadoMinutos / 60)}h`}
                  </span>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
                <button
                  onClick={() => handleToggleActivo(s)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
                  style={{
                    color: s.activo
                      ? "var(--color-warning)"
                      : "var(--color-success)",
                    backgroundColor: s.activo
                      ? "var(--color-warning-bg)"
                      : "var(--color-success-bg)",
                  }}
                  title={s.activo ? "Desactivar" : "Activar"}
                >
                  {s.activo ? (
                    <X className="w-3 h-3" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  {s.activo ? "Desactivar" : "Activar"}
                </button>

                <button
                  onClick={() => abrirEditar(s)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ml-auto"
                  style={{
                    color: "var(--color-accent)",
                    backgroundColor: "var(--color-accent-light)",
                  }}
                >
                  <Pencil className="w-3 h-3" />
                  Editar
                </button>

                <button
                  onClick={() => setConfirmEliminar(s)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors"
                  style={{
                    color: "var(--color-danger)",
                    backgroundColor: "var(--color-danger-bg)",
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Crear/Editar ───────────────────────────── */}
      <Modal
        isOpen={mostrarModal}
        onClose={cerrarModal}
        title={servicioEditando ? "Editar Servicio" : "Nuevo Servicio"}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre del servicio *"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Cambio de pantalla"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Marca"
              value={form.marca}
              onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
              placeholder="Ej: Samsung"
            />
            <Input
              label="Modelo"
              value={form.modelo}
              onChange={(e) =>
                setForm((f) => ({ ...f, modelo: e.target.value }))
              }
              placeholder="Ej: A51"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio base (MXN) *"
              type="number"
              min="0"
              step="0.01"
              value={form.precioBase}
              onChange={(e) =>
                setForm((f) => ({ ...f, precioBase: e.target.value }))
              }
              placeholder="0.00"
            />
            <Input
              label="Tiempo estimado (min)"
              type="number"
              min="1"
              value={form.tiempoEstimadoMinutos}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  tiempoEstimadoMinutos: e.target.value,
                }))
              }
              placeholder="60"
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Descripción (opcional)
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm((f) => ({ ...f, descripcion: e.target.value }))
              }
              placeholder="Descripción del servicio o instrucciones especiales…"
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border resize-none outline-none transition-all"
              style={{
                backgroundColor: "var(--color-bg-sunken)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) =>
                setForm((f) => ({ ...f, activo: e.target.checked }))
              }
              className="rounded"
            />
            <span
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Servicio activo
            </span>
          </label>

          {errorForm && (
            <p
              className="text-sm rounded-lg px-3 py-2"
              style={{
                backgroundColor: "var(--color-danger-bg)",
                color: "var(--color-danger-text)",
              }}
            >
              {errorForm}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={cerrarModal} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={guardando}>
              {guardando ? "Guardando…" : servicioEditando ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Confirmar Eliminar ─────────────────────── */}
      <Modal
        isOpen={!!confirmEliminar}
        onClose={() => setConfirmEliminar(null)}
        title="Eliminar servicio"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            ¿Estás seguro de eliminar{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {confirmEliminar?.nombre}
            </strong>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmEliminar(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleEliminar}
              disabled={eliminando}
            >
              {eliminando ? "Eliminando…" : "Eliminar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
