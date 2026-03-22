"use client";

/**
 * FASE 56: Panel de Permisos Granulares por Empleado
 *
 * Muestra todos los grupos de permisos con toggles por permiso.
 * Compara el estado actual con los defaults del rol para indicar qué
 * es override explícito vs. lo que viene del rol.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Package, Warehouse, CreditCard, Wallet,
  Store, BarChart2, Wrench, ShoppingBag, ShoppingCart,
  Users, Clock, Save, RotateCcw, Loader2, ChevronDown,
  ChevronRight,
} from "lucide-react";
import { GRUPOS_PERMISOS, PERMISOS_ROL, type Permiso } from "@/lib/permisos";
import type { MapaPermisos, UserRole } from "@/types";

// ─── Mapa de íconos ───────────────────────────────────────────────────────────

const ICONOS: Record<string, React.ReactNode> = {
  Package:      <Package      size={15} />,
  Warehouse:    <Warehouse    size={15} />,
  CreditCard:   <CreditCard   size={15} />,
  Wallet:       <Wallet       size={15} />,
  Store:        <Store        size={15} />,
  BarChart2:    <BarChart2    size={15} />,
  Wrench:       <Wrench       size={15} />,
  ShoppingBag:  <ShoppingBag  size={15} />,
  ShoppingCart: <ShoppingCart size={15} />,
  Users:        <Users        size={15} />,
  Clock:        <Clock        size={15} />,
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  empleadoId:   string;
  empleadoRol:  UserRole;
  empleadoNombre: string;
  canEdit:      boolean;   // si el viewer tiene permiso empleado_editar
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PermisosEmpleadoPanel({
  empleadoId,
  empleadoRol,
  empleadoNombre,
  canEdit,
}: Props) {
  const [mapa,         setMapa]         = useState<MapaPermisos>({});
  const [mapaOriginal, setMapaOriginal] = useState<MapaPermisos>({});
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set(["productos", "pos"]));

  // Defaults del rol (para indicar qué es override)
  const defaultsRol: Permiso[] = PERMISOS_ROL[empleadoRol] ?? [];

  // ─── Cargar permisos ──────────────────────────────────────────────────────

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/empleados/${empleadoId}/permisos`);
      const json = await res.json() as { success: boolean; data?: MapaPermisos; error?: string };
      if (!json.success) throw new Error(json.error ?? "Error al cargar");
      setMapa(json.data ?? {});
      setMapaOriginal(json.data ?? {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [empleadoId]);

  useEffect(() => { cargar(); }, [cargar]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /** Valor efectivo del permiso (override o default del rol) */
  function valorEfectivo(permiso: Permiso): boolean {
    if (permiso in mapa) return mapa[permiso];
    return defaultsRol.includes(permiso);
  }

  /** ¿El permiso tiene un override explícito respecto al default del rol? */
  function esOverride(permiso: Permiso): boolean {
    if (!(permiso in mapa)) return false;
    const defaultRol = defaultsRol.includes(permiso);
    return mapa[permiso] !== defaultRol;
  }

  /** ¿Hay cambios sin guardar? */
  const hayCambios = JSON.stringify(mapa) !== JSON.stringify(mapaOriginal);

  // ─── Acciones ─────────────────────────────────────────────────────────────

  function toggle(permiso: Permiso) {
    if (!canEdit) return;
    const actual   = valorEfectivo(permiso);
    const nuevoVal = !actual;
    const defaultRol = defaultsRol.includes(permiso);

    setMapa(prev => {
      const next = { ...prev };
      if (nuevoVal === defaultRol) {
        // Si el nuevo valor coincide con el default del rol → eliminamos el override
        delete next[permiso];
      } else {
        next[permiso] = nuevoVal;
      }
      return next;
    });
  }

  function resetearARol() {
    if (!canEdit) return;
    setMapa({});  // sin overrides → puro default del rol
  }

  async function guardar() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/empleados/${empleadoId}/permisos`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ permisos: mapa }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) throw new Error(json.error ?? "Error al guardar");
      setMapaOriginal({ ...mapa });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function toggleGrupo(grupoId: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(grupoId)) next.delete(grupoId);
      else next.add(grupoId);
      return next;
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2" style={{ color: "var(--color-text-muted)" }}>
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Cargando permisos…</span>
      </div>
    );
  }

  if (error && !mapa) {
    return (
      <div className="rounded-lg p-4 text-sm" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger-text)" }}>
        {error}
        <button onClick={cargar} className="ml-3 underline text-xs">Reintentar</button>
      </div>
    );
  }

  // Conteo de overrides activos
  const totalOverrides = Object.keys(mapa).length;

  return (
    <div className="flex flex-col gap-4">

      {/* Header del panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
          <Shield size={16} />
          <span className="text-sm font-medium">
            Permisos de <strong style={{ color: "var(--color-text-primary)" }}>{empleadoNombre}</strong>
          </span>
          {totalOverrides > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
            >
              {totalOverrides} override{totalOverrides !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={resetearARol}
              disabled={totalOverrides === 0 || saving}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors disabled:opacity-40"
              style={{
                background: "var(--color-bg-elevated)",
                color:      "var(--color-text-secondary)",
                border:     "1px solid var(--color-border)",
              }}
            >
              <RotateCcw size={12} />
              Defaults del rol
            </button>
            <button
              onClick={guardar}
              disabled={!hayCambios || saving}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors disabled:opacity-40"
              style={{
                background: hayCambios ? "var(--color-primary)" : "var(--color-bg-elevated)",
                color:      hayCambios ? "var(--color-primary-text)" : "var(--color-text-muted)",
                border:     "1px solid var(--color-border)",
              }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Guardar cambios
            </button>
          </div>
        )}
      </div>

      {/* Mensaje de error al guardar */}
      {error && (
        <div className="rounded-md px-3 py-2 text-xs" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger-text)" }}>
          {error}
        </div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: "var(--color-success)" }} />
          Activo por rol
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: "var(--color-accent)" }} />
          Override concedido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: "var(--color-danger)" }} />
          Override revocado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: "var(--color-border-strong)" }} />
          Inactivo por rol
        </span>
      </div>

      {/* Grupos de permisos */}
      <div className="flex flex-col gap-2">
        {GRUPOS_PERMISOS.map(grupo => {
          const isOpen = expanded.has(grupo.id);
          const activos = grupo.permisos.filter(p => valorEfectivo(p.key)).length;

          return (
            <div
              key={grupo.id}
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--color-border-subtle)", background: "var(--color-bg-surface)" }}
            >
              {/* Cabecera del grupo */}
              <button
                onClick={() => toggleGrupo(grupo.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                style={{ background: isOpen ? "var(--color-bg-elevated)" : "var(--color-bg-surface)" }}
              >
                <div className="flex items-center gap-2.5">
                  <span style={{ color: "var(--color-accent)" }}>
                    {ICONOS[grupo.icono] ?? <Shield size={15} />}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {grupo.label}
                  </span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background: activos > 0 ? "var(--color-success-bg)" : "var(--color-bg-sunken)",
                      color:      activos > 0 ? "var(--color-success-text)" : "var(--color-text-muted)",
                    }}
                  >
                    {activos}/{grupo.permisos.length}
                  </span>
                </div>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              </button>

              {/* Permisos del grupo */}
              {isOpen && (
                <div className="divide-y" style={{ borderColor: "var(--color-border-subtle)" }}>
                  {grupo.permisos.map(p => {
                    const activo   = valorEfectivo(p.key);
                    const override = esOverride(p.key);
                    const defaultRol = defaultsRol.includes(p.key);

                    // Color del toggle
                    let toggleBg = activo
                      ? (override ? "var(--color-accent)" : "var(--color-success)")
                      : (override ? "var(--color-danger)" : "var(--color-border-strong)");

                    return (
                      <div
                        key={p.key}
                        className="flex items-center justify-between px-4 py-2.5 gap-4"
                        style={{ background: "var(--color-bg-surface)" }}
                      >
                        {/* Info del permiso */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                              {p.label}
                            </span>
                            {override && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded font-medium"
                                style={{
                                  background: activo ? "var(--color-accent-light)" : "var(--color-danger-bg)",
                                  color:      activo ? "var(--color-accent)"       : "var(--color-danger-text)",
                                }}
                              >
                                {activo ? "+" : "−"} override
                              </span>
                            )}
                          </div>
                          <span className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                            {p.desc}
                            {!override && (
                              <span className="ml-1.5 opacity-60">
                                · {defaultRol ? "activo por rol" : "inactivo por rol"}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Toggle */}
                        <button
                          onClick={() => toggle(p.key)}
                          disabled={!canEdit}
                          aria-label={activo ? `Desactivar ${p.label}` : `Activar ${p.label}`}
                          className="relative flex-shrink-0 transition-all"
                          style={{ cursor: canEdit ? "pointer" : "default" }}
                        >
                          <span
                            className="block rounded-full transition-colors duration-200"
                            style={{
                              width:  "40px",
                              height: "22px",
                              background: toggleBg,
                              opacity: canEdit ? 1 : 0.6,
                            }}
                          />
                          <span
                            className="absolute top-0.5 rounded-full bg-white shadow-sm transition-transform duration-200"
                            style={{
                              width:     "18px",
                              height:    "18px",
                              left:      activo ? "20px" : "2px",
                              boxShadow: "var(--shadow-xs)",
                            }}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer con info */}
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Los cambios se aplican la próxima vez que el empleado inicie sesión. Los permisos sin override
        heredan los defaults del rol <strong>{empleadoRol}</strong>.
      </p>

    </div>
  );
}
