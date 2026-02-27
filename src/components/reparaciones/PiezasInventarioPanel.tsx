"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  Loader2,
  ShoppingCart,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  PiezaReparacion,
  Producto,
  SolicitudPieza,
  GarantiaPieza,
  EstadoSolicitudPieza,
} from "@/types";

interface Props {
  ordenId: string;
  estadoOrden: string;
  onCostoActualizado?: () => void;
}

type BadgeStyle = { background: string; color: string };

const ESTADO_SOLICITUD_LABEL: Record<EstadoSolicitudPieza, string> = {
  pendiente: "Pendiente",
  enviada: "Enviada",
  recibida: "Recibida",
  cancelada: "Cancelada",
};

const ESTADO_SOLICITUD_STYLE: Record<EstadoSolicitudPieza, BadgeStyle> = {
  pendiente: { background: "var(--color-warning-bg)",  color: "var(--color-warning-text)" },
  enviada:   { background: "var(--color-info-bg)",     color: "var(--color-info-text)" },
  recibida:  { background: "var(--color-success-bg)",  color: "var(--color-success-text)" },
  cancelada: { background: "var(--color-bg-elevated)", color: "var(--color-text-muted)" },
};

const ESTADO_GARANTIA_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  enviada:   "Enviada",
  aprobada:  "Aprobada",
  rechazada: "Rechazada",
  resuelta:  "Resuelta",
};

const ESTADO_GARANTIA_STYLE: Record<string, BadgeStyle> = {
  pendiente: { background: "var(--color-warning-bg)",  color: "var(--color-warning-text)" },
  enviada:   { background: "var(--color-info-bg)",     color: "var(--color-info-text)" },
  aprobada:  { background: "var(--color-success-bg)",  color: "var(--color-success-text)" },
  rechazada: { background: "var(--color-danger-bg)",   color: "var(--color-danger-text)" },
  resuelta:  { background: "var(--color-accent-light)", color: "var(--color-accent)" },
};

const inputSt: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  fontSize: "0.875rem",
  border: "1px solid var(--color-border)",
  borderRadius: "0.5rem",
  background: "var(--color-bg-surface)",
  color: "var(--color-text-primary)",
  outline: "none",
};

const labelSt: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 500,
  color: "var(--color-text-secondary)",
  marginBottom: "0.25rem",
};

// ── SearchResultBtn ────────────────────────────────────────────
function SearchResultBtn({
  producto,
  sinStock,
  onSelect,
}: {
  producto: Producto;
  sinStock: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left px-4 py-3 flex items-center justify-between"
      style={{
        background: hovered ? "var(--color-bg-elevated)" : "transparent",
        borderBottom: "1px solid var(--color-border-subtle)",
        transition: "background 150ms",
      }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          {producto.nombre}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {producto.marca} {producto.modelo}
        </p>
      </div>
      <div className="text-right">
        {sinStock ? (
          <p className="text-xs font-medium" style={{ color: "var(--color-warning)" }}>
            Sin stock — Solicitar
          </p>
        ) : (
          <p className="text-xs font-medium" style={{ color: "var(--color-success)" }}>
            Stock: {producto.stock}
          </p>
        )}
        <p
          className="text-xs"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-data)" }}
        >
          ${(producto.costo ?? producto.precio ?? 0).toFixed(2)}
        </p>
      </div>
    </button>
  );
}

// ── PiezaRow ────────────────────────────────────────────────────
function PiezaRow({
  pieza,
  tieneGarantia,
  puedeEditar,
  quitando,
  onQuitarPieza,
  onSolicitarGarantia,
}: {
  pieza: PiezaReparacion;
  tieneGarantia: boolean;
  puedeEditar: boolean;
  quitando: string | null;
  onQuitarPieza: (id: string) => void;
  onSolicitarGarantia: (pieza: PiezaReparacion) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex items-center justify-between rounded-lg px-4 py-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--color-bg-elevated)" : "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        transition: "background 150ms",
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
          {pieza.nombrePieza}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {pieza.cantidad} {pieza.cantidad === 1 ? "unidad" : "unidades"} ×{" "}
          <span style={{ fontFamily: "var(--font-data)" }}>
            ${pieza.costoUnitario.toFixed(2)}
          </span>
          {pieza.notas && (
            <span style={{ marginLeft: "0.5rem", color: "var(--color-accent)" }}>
              • {pieza.notas}
            </span>
          )}
        </p>
        {tieneGarantia && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-danger)" }}>
            ⚠ Garantía activa
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        <span
          className="text-sm font-semibold whitespace-nowrap"
          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}
        >
          ${pieza.costoTotal.toFixed(2)}
        </span>
        {puedeEditar && (
          <>
            {!tieneGarantia && (
              <button
                onClick={() => onSolicitarGarantia(pieza)}
                className="p-1 transition-colors"
                style={{ color: "var(--color-text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-danger)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                title="Solicitar garantía (pieza dañada o no funciona)"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onQuitarPieza(pieza.id)}
              disabled={quitando === pieza.id}
              className="p-1 transition-colors disabled:opacity-50"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-danger)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
              title="Quitar pieza y devolver al inventario"
            >
              {quitando === pieza.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export function PiezasInventarioPanel({ ordenId, estadoOrden, onCostoActualizado }: Props) {
  const [piezas, setPiezas] = useState<PiezaReparacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [costoUnitario, setCostoUnitario] = useState(0);
  const [notas, setNotas] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [quitando, setQuitando] = useState<string | null>(null);

  const [solicitudes, setSolicitudes] = useState<SolicitudPieza[]>([]);
  const [mostrarSolicitudes, setMostrarSolicitudes] = useState(false);
  const [mostrarFormSolicitud, setMostrarFormSolicitud] = useState(false);
  const [solicitudProducto, setSolicitudProducto] = useState<Producto | null>(null);
  const [solicitudNombre, setSolicitudNombre] = useState("");
  const [solicitudDescripcion, setSolicitudDescripcion] = useState("");
  const [solicitudCantidad, setSolicitudCantidad] = useState(1);
  const [solicitudNotas, setSolicitudNotas] = useState("");
  const [creandoSolicitud, setCreandoSolicitud] = useState(false);
  const [actualizandoSolicitud, setActualizandoSolicitud] = useState<string | null>(null);

  const [garantias, setGarantias] = useState<GarantiaPieza[]>([]);
  const [mostrarGarantias, setMostrarGarantias] = useState(false);
  const [piezaGarantia, setPiezaGarantia] = useState<PiezaReparacion | null>(null);
  const [motivoGarantia, setMotivoGarantia] = useState("");
  const [creandoGarantia, setCreandoGarantia] = useState(false);

  const puedeEditar = !["cancelada", "entregada"].includes(estadoOrden);

  const cargarPiezas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reparaciones/${ordenId}/piezas`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPiezas(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar piezas");
    } finally {
      setLoading(false);
    }
  }, [ordenId]);

  const cargarSolicitudes = useCallback(async () => {
    try {
      const res = await fetch(`/api/reparaciones/${ordenId}/solicitudes-piezas`);
      const data = await res.json();
      if (data.success) setSolicitudes(data.data);
    } catch { /* silencioso */ }
  }, [ordenId]);

  const cargarGarantias = useCallback(async () => {
    try {
      const res = await fetch(`/api/reparaciones/${ordenId}/garantias-piezas`);
      const data = await res.json();
      if (data.success) setGarantias(data.data);
    } catch { /* silencioso */ }
  }, [ordenId]);

  useEffect(() => {
    cargarPiezas();
    cargarSolicitudes();
    cargarGarantias();
  }, [cargarPiezas, cargarSolicitudes, cargarGarantias]);

  useEffect(() => {
    if (!busqueda.trim() || busqueda.length < 2) {
      setResultados([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/productos?q=${encodeURIComponent(busqueda)}&limit=10`);
        const data = await res.json();
        setResultados(data.data || []);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const seleccionarProducto = (producto: Producto) => {
    if ((producto.stock ?? 0) <= 0) {
      setSolicitudProducto(producto);
      setSolicitudNombre(producto.nombre);
      setSolicitudCantidad(1);
      setSolicitudDescripcion("");
      setSolicitudNotas("");
      setMostrarFormSolicitud(true);
      setMostrarBuscador(false);
      setResultados([]);
      setBusqueda("");
    } else {
      setProductoSeleccionado(producto);
      setCostoUnitario(producto.costo ?? producto.precio ?? 0);
      setCantidad(1);
      setNotas("");
      setResultados([]);
      setBusqueda("");
    }
  };

  const agregarPieza = async () => {
    if (!productoSeleccionado) return;
    setAgregando(true);
    setError(null);
    try {
      const res = await fetch(`/api/reparaciones/${ordenId}/piezas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: productoSeleccionado.id,
          cantidad,
          costoUnitario,
          notas: notas.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await cargarPiezas();
      setProductoSeleccionado(null);
      setCantidad(1);
      setCostoUnitario(0);
      setNotas("");
      setMostrarBuscador(false);
      onCostoActualizado?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al agregar pieza");
    } finally {
      setAgregando(false);
    }
  };

  const quitarPieza = async (piezaId: string) => {
    setQuitando(piezaId);
    setError(null);
    try {
      const res = await fetch(`/api/reparaciones/${ordenId}/piezas`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piezaId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await cargarPiezas();
      onCostoActualizado?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al quitar pieza");
    } finally {
      setQuitando(null);
    }
  };

  const crearSolicitud = async () => {
    if (!solicitudNombre.trim()) return;
    setCreandoSolicitud(true);
    setError(null);
    try {
      const res = await fetch(`/api/reparaciones/${ordenId}/solicitudes-piezas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productoId: solicitudProducto?.id,
          nombrePieza: solicitudNombre.trim(),
          descripcion: solicitudDescripcion.trim() || undefined,
          cantidad: solicitudCantidad,
          notas: solicitudNotas.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await cargarSolicitudes();
      setMostrarFormSolicitud(false);
      setSolicitudProducto(null);
      setSolicitudNombre("");
      setSolicitudDescripcion("");
      setSolicitudCantidad(1);
      setSolicitudNotas("");
      setMostrarSolicitudes(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear solicitud");
    } finally {
      setCreandoSolicitud(false);
    }
  };

  const actualizarSolicitud = async (solicitudId: string, estado: EstadoSolicitudPieza) => {
    setActualizandoSolicitud(solicitudId);
    try {
      const res = await fetch(`/api/reparaciones/${ordenId}/solicitudes-piezas`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solicitudId, estado }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await cargarSolicitudes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar solicitud");
    } finally {
      setActualizandoSolicitud(null);
    }
  };

  const solicitarGarantia = async () => {
    if (!piezaGarantia || !motivoGarantia.trim()) return;
    setCreandoGarantia(true);
    setError(null);
    try {
      const res = await fetch(`/api/reparaciones/${ordenId}/garantias-piezas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          piezaReparacionId: piezaGarantia.id,
          motivoGarantia: motivoGarantia.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await cargarGarantias();
      setPiezaGarantia(null);
      setMotivoGarantia("");
      setMostrarGarantias(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al solicitar garantía");
    } finally {
      setCreandoGarantia(false);
    }
  };

  const totalPiezas = piezas.reduce((sum, p) => sum + p.costoTotal, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-accent)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="flex items-center gap-2 rounded-lg p-3 text-sm"
          style={{
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-danger)",
            color: "var(--color-danger-text)",
          }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <Package className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
            Piezas del Inventario
          </h3>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {piezas.length} pieza{piezas.length !== 1 ? "s" : ""} usada{piezas.length !== 1 ? "s" : ""}
            {totalPiezas > 0 && (
              <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
                {" "}— Total:{" "}
                <span style={{ fontFamily: "var(--font-data)" }}>${totalPiezas.toFixed(2)}</span> MXN
              </span>
            )}
          </p>
        </div>
        {puedeEditar && !mostrarBuscador && !mostrarFormSolicitud && (
          <Button size="sm" onClick={() => setMostrarBuscador(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar pieza
          </Button>
        )}
      </div>

      {/* ── Panel de búsqueda ────────────────────────────────────── */}
      {mostrarBuscador && puedeEditar && (
        <div
          className="rounded-lg p-4 space-y-4"
          style={{ border: "1px solid var(--color-info)", background: "var(--color-info-bg)" }}
        >
          <h4 className="text-sm font-medium" style={{ color: "var(--color-info-text)" }}>
            Buscar pieza en el inventario
          </h4>

          {!productoSeleccionado ? (
            <div className="relative">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--color-text-muted)" }}
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre, marca, modelo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={{ ...inputSt, paddingLeft: "2.25rem", paddingRight: "2.25rem" }}
                  autoFocus
                />
                {buscando && (
                  <Loader2
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                )}
              </div>

              {resultados.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-lg overflow-hidden"
                  style={{
                    background: "var(--color-bg-surface)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  {resultados.map((producto) => (
                    <SearchResultBtn
                      key={producto.id}
                      producto={producto}
                      sinStock={(producto.stock ?? 0) <= 0}
                      onSelect={() => seleccionarProducto(producto)}
                    />
                  ))}
                </div>
              )}

              {busqueda.length >= 2 && !buscando && resultados.length === 0 && (
                <p className="mt-2 text-sm text-center py-2" style={{ color: "var(--color-text-muted)" }}>
                  No se encontraron productos
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div
                className="rounded-lg p-3 flex items-center justify-between"
                style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {productoSeleccionado.nombre}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Stock disponible:{" "}
                    <span style={{ color: "var(--color-success)", fontWeight: 500 }}>
                      {productoSeleccionado.stock}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setProductoSeleccionado(null)}
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Cambiar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelSt}>Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    max={productoSeleccionado.stock}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    style={inputSt}
                  />
                </div>
                <div>
                  <label style={labelSt}>Costo unitario (MXN)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(parseFloat(e.target.value) || 0)}
                    style={{ ...inputSt, fontFamily: "var(--font-data)" }}
                  />
                </div>
              </div>

              <div>
                <label style={labelSt}>Notas (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Original, Compatible, OEM..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  style={inputSt}
                />
              </div>

              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Total a descontar:{" "}
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-data)",
                  }}
                >
                  ${(cantidad * costoUnitario).toFixed(2)} MXN
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {productoSeleccionado && (
              <Button size="sm" onClick={agregarPieza} disabled={agregando}>
                {agregando ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Agregando...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-1" /> Confirmar pieza</>
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setMostrarBuscador(false);
                setProductoSeleccionado(null);
                setBusqueda("");
                setResultados([]);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* ── Formulario de solicitud al distribuidor ──────────────── */}
      {mostrarFormSolicitud && puedeEditar && (
        <div
          className="rounded-lg p-4 space-y-3"
          style={{ border: "1px solid var(--color-warning)", background: "var(--color-warning-bg)" }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
            <h4 className="text-sm font-medium" style={{ color: "var(--color-warning-text)" }}>
              Solicitar pieza al distribuidor
            </h4>
          </div>
          {solicitudProducto && (
            <p className="text-xs" style={{ color: "var(--color-warning-text)" }}>
              Pieza sin stock: <span className="font-medium">{solicitudProducto.nombre}</span>
            </p>
          )}

          <div>
            <label style={labelSt}>Nombre de la pieza *</label>
            <input
              type="text"
              value={solicitudNombre}
              onChange={(e) => setSolicitudNombre(e.target.value)}
              style={inputSt}
              placeholder="Ej: Pantalla LCD iPhone 13"
            />
          </div>

          <div>
            <label style={labelSt}>Especificaciones (opcional)</label>
            <input
              type="text"
              value={solicitudDescripcion}
              onChange={(e) => setSolicitudDescripcion(e.target.value)}
              style={inputSt}
              placeholder="Ej: Original, OLED, Negro"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelSt}>Cantidad</label>
              <input
                type="number"
                min={1}
                value={solicitudCantidad}
                onChange={(e) => setSolicitudCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                style={inputSt}
              />
            </div>
            <div>
              <label style={labelSt}>Notas (opcional)</label>
              <input
                type="text"
                value={solicitudNotas}
                onChange={(e) => setSolicitudNotas(e.target.value)}
                placeholder="Urgente, color, etc."
                style={inputSt}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={crearSolicitud} disabled={creandoSolicitud || !solicitudNombre.trim()}>
              {creandoSolicitud ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Enviando...</>
              ) : (
                <><ShoppingCart className="w-4 h-4 mr-1" /> Crear solicitud</>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => { setMostrarFormSolicitud(false); setSolicitudProducto(null); }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* ── Modal de garantía ────────────────────────────────────── */}
      {piezaGarantia && (
        <div
          className="rounded-lg p-4 space-y-3"
          style={{ border: "1px solid var(--color-danger)", background: "var(--color-danger-bg)" }}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
            <h4 className="text-sm font-medium" style={{ color: "var(--color-danger-text)" }}>
              Solicitar garantía
            </h4>
          </div>
          <p className="text-xs" style={{ color: "var(--color-danger-text)" }}>
            Pieza: <span className="font-medium">{piezaGarantia.nombrePieza}</span>
          </p>

          <div>
            <label style={labelSt}>Motivo de garantía *</label>
            <textarea
              rows={2}
              value={motivoGarantia}
              onChange={(e) => setMotivoGarantia(e.target.value)}
              placeholder="Describe el problema: pieza dañada, no funciona, etc."
              style={{ ...inputSt, resize: "none" }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="danger"
              onClick={solicitarGarantia}
              disabled={creandoGarantia || !motivoGarantia.trim()}
            >
              {creandoGarantia ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Enviando...</>
              ) : (
                <><ShieldAlert className="w-4 h-4 mr-1" /> Solicitar garantía</>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => { setPiezaGarantia(null); setMotivoGarantia(""); }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* ── Lista de piezas registradas ──────────────────────────── */}
      {piezas.length === 0 ? (
        <div className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay piezas del inventario registradas</p>
          {puedeEditar && (
            <p className="text-xs mt-1">
              Usa el botón &quot;Agregar pieza&quot; para vincular piezas del inventario
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {piezas.map((pieza) => {
            const tieneGarantia = garantias.some(
              (g) => g.piezaReparacionId === pieza.id && g.estado !== "resuelta"
            );
            return (
              <PiezaRow
                key={pieza.id}
                pieza={pieza}
                tieneGarantia={tieneGarantia}
                puedeEditar={puedeEditar}
                quitando={quitando}
                onQuitarPieza={quitarPieza}
                onSolicitarGarantia={(p) => { setPiezaGarantia(p); setMotivoGarantia(""); }}
              />
            );
          })}

          <div
            className="flex items-center justify-between pt-3 mt-2"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Total piezas
            </span>
            <span
              className="text-base font-bold"
              style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}
            >
              ${totalPiezas.toFixed(2)} MXN
            </span>
          </div>
        </div>
      )}

      {/* ── Solicitudes al distribuidor ──────────────────────────── */}
      {(solicitudes.length > 0 || puedeEditar) && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--color-warning)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            style={{ background: "var(--color-warning-bg)" }}
            onClick={() => setMostrarSolicitudes((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-warning-text)" }}>
                Solicitudes al distribuidor
              </span>
              {solicitudes.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--color-warning)", color: "#fff", fontSize: "0.7rem" }}
                >
                  {solicitudes.length}
                </span>
              )}
            </div>
            {mostrarSolicitudes ? (
              <ChevronUp className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
            )}
          </button>

          {mostrarSolicitudes && (
            <div style={{ borderTop: "1px solid var(--color-warning)" }}>
              {solicitudes.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--color-text-muted)" }}>
                  No hay solicitudes de piezas
                </p>
              ) : (
                solicitudes.map((sol) => (
                  <div
                    key={sol.id}
                    className="px-4 py-3"
                    style={{
                      background: "var(--color-bg-surface)",
                      borderBottom: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                          {sol.nombrePieza}
                        </p>
                        {sol.descripcion && (
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {sol.descripcion}
                          </p>
                        )}
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          Cantidad: {sol.cantidad}
                          {sol.notas && <span className="ml-2">• {sol.notas}</span>}
                        </p>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={ESTADO_SOLICITUD_STYLE[sol.estado] ?? {}}
                      >
                        {ESTADO_SOLICITUD_LABEL[sol.estado]}
                      </span>
                    </div>

                    {puedeEditar && sol.estado !== "cancelada" && sol.estado !== "recibida" && (
                      <div className="flex gap-2 mt-2">
                        {sol.estado === "pendiente" && (
                          <button
                            disabled={actualizandoSolicitud === sol.id}
                            onClick={() => actualizarSolicitud(sol.id, "enviada")}
                            className="flex items-center gap-1 text-xs disabled:opacity-50"
                            style={{ color: "var(--color-accent)" }}
                          >
                            {actualizandoSolicitud === sol.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            Marcar enviada
                          </button>
                        )}
                        {sol.estado === "enviada" && (
                          <button
                            disabled={actualizandoSolicitud === sol.id}
                            onClick={() => actualizarSolicitud(sol.id, "recibida")}
                            className="flex items-center gap-1 text-xs disabled:opacity-50"
                            style={{ color: "var(--color-success)" }}
                          >
                            {actualizandoSolicitud === sol.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Marcar recibida
                          </button>
                        )}
                        <button
                          disabled={actualizandoSolicitud === sol.id}
                          onClick={() => actualizarSolicitud(sol.id, "cancelada")}
                          className="flex items-center gap-1 text-xs disabled:opacity-50"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <X className="w-3 h-3" />
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}

              {puedeEditar && (
                <div className="px-4 py-3" style={{ background: "var(--color-warning-bg)" }}>
                  <button
                    onClick={() => {
                      setSolicitudProducto(null);
                      setSolicitudNombre("");
                      setSolicitudDescripcion("");
                      setSolicitudCantidad(1);
                      setSolicitudNotas("");
                      setMostrarFormSolicitud(true);
                      setMostrarBuscador(false);
                    }}
                    className="text-xs flex items-center gap-1"
                    style={{ color: "var(--color-warning-text)" }}
                  >
                    <Plus className="w-3 h-3" />
                    Nueva solicitud manual
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Garantías de piezas ──────────────────────────────────── */}
      {garantias.length > 0 && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--color-danger)" }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            style={{ background: "var(--color-danger-bg)" }}
            onClick={() => setMostrarGarantias((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-danger-text)" }}>
                Garantías de piezas
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--color-danger)", color: "#fff", fontSize: "0.7rem" }}
              >
                {garantias.length}
              </span>
            </div>
            {mostrarGarantias ? (
              <ChevronUp className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
            )}
          </button>

          {mostrarGarantias && (
            <div style={{ borderTop: "1px solid var(--color-danger)" }}>
              {garantias.map((g) => (
                <div
                  key={g.id}
                  className="px-4 py-3"
                  style={{
                    background: "var(--color-bg-surface)",
                    borderBottom: "1px solid var(--color-border-subtle)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                        {g.nombrePieza}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        {g.motivoGarantia}
                      </p>
                      {g.tipoResolucion && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-accent)" }}>
                          Resolución:{" "}
                          {{
                            reemplazo: "Reemplazo de pieza",
                            reembolso: "Reembolso de costo",
                            reparacion: "Reparación de pieza",
                            sin_resolucion: "Sin resolución",
                          }[g.tipoResolucion]}
                          {g.notasResolucion && ` — ${g.notasResolucion}`}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                      style={ESTADO_GARANTIA_STYLE[g.estado] ?? {}}
                    >
                      {ESTADO_GARANTIA_LABEL[g.estado] ?? g.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
