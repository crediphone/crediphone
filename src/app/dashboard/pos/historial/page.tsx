"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import {
  Download,
  Search,
  XCircle,
  Eye,
  DollarSign,
  Calendar,
  Filter,
  X,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";
import type { VentaDetallada, DevolucionDetallada } from "@/types";
import { DevolucionModal } from "@/components/pos/DevolucionModal";

// FASE 31: Exportar historial de ventas a Excel (CSV compatible)
function exportarVentasExcel(ventas: VentaDetallada[], nombre = "historial_ventas") {
  const filas: string[][] = [
    ["Folio", "Fecha", "Hora", "Cliente", "Vendedor", "Subtotal", "Descuento", "Total", "Método de Pago", "Estado"],
    ...ventas.map((v) => [
      v.folio,
      new Date(v.fechaVenta).toLocaleDateString("es-MX"),
      new Date(v.fechaVenta).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      v.clienteNombre || "",
      v.vendedorNombre || "",
      String(v.subtotal?.toFixed(2) ?? ""),
      String(v.descuento?.toFixed(2) ?? "0.00"),
      String(v.total.toFixed(2)),
      v.metodoPago,
      v.estado,
    ]),
  ];

  // BOM para que Excel abra correctamente el UTF-8
  const bom = "\uFEFF";
  const contenido = bom + filas.map((fila) =>
    fila.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nombre}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const selectStyle = {
  background: "var(--color-bg-sunken)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-primary)",
  width: "100%",
  padding: "0.5rem 0.75rem",
  borderRadius: "0.5rem",
  outline: "none",
};

function VentaRow({
  venta,
  onVerDetalle,
  onDescargar,
  onCancelar,
  onDevolver,
  isAdmin,
}: {
  venta: VentaDetallada;
  onVerDetalle: (id: string) => void;
  onDescargar: (id: string, folio: string) => void;
  onCancelar: (id: string, folio: string) => void;
  onDevolver: (venta: VentaDetallada) => void;
  isAdmin: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--color-bg-elevated)" : "transparent",
        borderBottom: "1px solid var(--color-border-subtle)",
        transition: "background 150ms",
      }}
    >
      <td
        className="px-4 py-3 text-sm font-medium"
        style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
      >
        {venta.folio}
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {new Date(venta.fechaVenta).toLocaleDateString("es-MX")}
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-primary)" }}>
        {venta.clienteNombre
          ? `${venta.clienteNombre} ${venta.clienteApellido || ""}`
          : "-"}
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {venta.vendedorNombre || "-"}
      </td>
      <td
        className="px-4 py-3 text-sm font-semibold"
        style={{ color: "var(--color-success)", fontFamily: "var(--font-data)" }}
      >
        ${venta.total.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-sm capitalize" style={{ color: "var(--color-text-secondary)" }}>
        {venta.metodoPago}
      </td>
      <td className="px-4 py-3">
        <span
          style={
            venta.estado === "completada"
              ? {
                  background: "var(--color-success-bg)",
                  color: "var(--color-success-text)",
                  padding: "2px 8px",
                  borderRadius: 9999,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }
              : {
                  background: "var(--color-danger-bg)",
                  color: "var(--color-danger-text)",
                  padding: "2px 8px",
                  borderRadius: 9999,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }
          }
        >
          {venta.estado === "completada" ? "Completada" : "Cancelada"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => onVerDetalle(venta.id)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-bg-elevated)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            style={{ padding: "4px", borderRadius: "0.375rem" }}
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
          </button>
          <button
            onClick={() => onDescargar(venta.id, venta.folio)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--color-bg-elevated)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            style={{ padding: "4px", borderRadius: "0.375rem" }}
            title="Descargar recibo"
          >
            <Download className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          </button>
          {isAdmin && venta.estado === "completada" && (
            <>
              {/* FASE 33: Botón devolución */}
              <button
                onClick={() => onDevolver(venta)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-warning-bg)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                style={{ padding: "4px", borderRadius: "0.375rem" }}
                title="Procesar devolución"
              >
                <RotateCcw className="w-4 h-4" style={{ color: "var(--color-warning)" }} />
              </button>
              <button
                onClick={() => onCancelar(venta.id, venta.folio)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-danger-bg)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                style={{ padding: "4px", borderRadius: "0.375rem" }}
                title="Cancelar venta"
              >
                <XCircle className="w-4 h-4" style={{ color: "var(--color-danger)" }} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function HistorialPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [ventas, setVentas] = useState<VentaDetallada[]>([]);
  const [filteredVentas, setFilteredVentas] = useState<VentaDetallada[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Modal detalle
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaDetallada | null>(null);

  // FASE 33: Modal devolución
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [ventaParaDevolver, setVentaParaDevolver] = useState<VentaDetallada | null>(null);

  // Redirect non-admin/vendedor/cobrador
  useEffect(() => {
    if (user && !["admin", "vendedor", "cobrador", "super_admin"].includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      fetchVentas();
    }
  }, [user]);

  useEffect(() => {
    aplicarFiltros();
  }, [ventas, searchTerm, filtroMetodo, filtroEstado, fechaInicio, fechaFin]);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pos/ventas");
      const data = await response.json();
      if (data.success) {
        setVentas(data.data);
      }
    } catch (error) {
      console.error("Error fetching ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...ventas];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.folio.toLowerCase().includes(term) ||
          v.clienteNombre?.toLowerCase().includes(term) ||
          v.clienteApellido?.toLowerCase().includes(term)
      );
    }

    if (filtroMetodo !== "todos") {
      filtered = filtered.filter((v) => v.metodoPago === filtroMetodo);
    }

    if (filtroEstado !== "todos") {
      filtered = filtered.filter((v) => v.estado === filtroEstado);
    }

    if (fechaInicio) {
      const inicio = new Date(fechaInicio);
      filtered = filtered.filter((v) => new Date(v.fechaVenta) >= inicio);
    }

    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59);
      filtered = filtered.filter((v) => new Date(v.fechaVenta) <= fin);
    }

    setFilteredVentas(filtered);
  };

  const handleVerDetalle = async (ventaId: string) => {
    try {
      const response = await fetch(`/api/pos/ventas/${ventaId}`);
      const data = await response.json();
      if (data.success) {
        setVentaSeleccionada(data.data);
        setShowDetalleModal(true);
      }
    } catch (error) {
      console.error("Error fetching venta detalle:", error);
      alert("Error al cargar detalles de la venta");
    }
  };

  const handleDescargarRecibo = async (ventaId: string, folio: string) => {
    try {
      const response = await fetch(`/api/pos/ventas/${ventaId}/recibo`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Error al generar recibo");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Recibo-${folio}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error al descargar recibo:", error);
      alert("Error al descargar el recibo");
    }
  };

  const handleCancelarVenta = async (ventaId: string, folio: string) => {
    if (user?.role !== "admin" && user?.role !== "super_admin") {
      alert("Solo administradores pueden cancelar ventas");
      return;
    }

    const motivo = prompt(`Motivo de cancelación para ${folio}:`);
    if (!motivo) return;

    if (!confirm(`¿Cancelar venta ${folio}? El stock será restaurado.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/pos/ventas/${ventaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancelar", motivo }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Venta cancelada exitosamente");
        fetchVentas();
        setShowDetalleModal(false);
      } else {
        alert(data.error || "Error al cancelar venta");
      }
    } catch (error) {
      console.error("Error canceling venta:", error);
      alert("Error al cancelar venta");
    }
  };

  // FASE 33: Abrir modal de devolución
  const handleDevolver = async (venta: VentaDetallada) => {
    // Necesitamos los items detallados — hacer fetch si no los tenemos
    if (!venta.items || venta.items.length === 0) {
      try {
        const res = await fetch(`/api/pos/ventas/${venta.id}`);
        const json = await res.json();
        if (json.success) {
          setVentaParaDevolver(json.data);
        } else {
          setVentaParaDevolver(venta);
        }
      } catch {
        setVentaParaDevolver(venta);
      }
    } else {
      setVentaParaDevolver(venta);
    }
    setShowDevolucionModal(true);
  };

  const handleDevolucionCreada = (_devolucion: DevolucionDetallada) => {
    // Refrescar lista de ventas para reflejar el nuevo estado
    fetchVentas();
  };

  const limpiarFiltros = () => {
    setSearchTerm("");
    setFiltroMetodo("todos");
    setFiltroEstado("todos");
    setFechaInicio("");
    setFechaFin("");
  };

  if (!user || !["admin", "vendedor", "cobrador", "super_admin"].includes(user.role)) {
    return null;
  }

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const totalVentas = filteredVentas.length;
  const totalMonto = filteredVentas.reduce((sum, v) => sum + v.total, 0);
  const totalEfectivo = filteredVentas
    .filter((v) => v.metodoPago === "efectivo" || v.desgloseMixto?.efectivo)
    .reduce(
      (sum, v) =>
        sum + (v.metodoPago === "efectivo" ? v.total : v.desgloseMixto?.efectivo || 0),
      0
    );
  const totalTarjeta = filteredVentas
    .filter((v) => v.metodoPago === "tarjeta" || v.desgloseMixto?.tarjeta)
    .reduce(
      (sum, v) =>
        sum + (v.metodoPago === "tarjeta" ? v.total : v.desgloseMixto?.tarjeta || 0),
      0
    );
  const totalTransferencia = filteredVentas
    .filter((v) => v.metodoPago === "transferencia" || v.desgloseMixto?.transferencia)
    .reduce(
      (sum, v) =>
        sum +
        (v.metodoPago === "transferencia" ? v.total : v.desgloseMixto?.transferencia || 0),
      0
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Historial de Ventas
          </h1>
          <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
            Consulta y gestiona el historial de ventas del punto de venta
          </p>
        </div>
        {/* FASE 31: Exportar a Excel */}
        {filteredVentas.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => exportarVentasExcel(filteredVentas, "historial_ventas")}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Total Ventas
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}
          >
            {totalVentas}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Total Monto
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color: "var(--color-success)", fontFamily: "var(--font-data)" }}
          >
            ${totalMonto.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Efectivo
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color: "var(--color-accent)", fontFamily: "var(--font-data)" }}
          >
            ${totalEfectivo.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Tarjeta/Transfer
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color: "var(--color-info)", fontFamily: "var(--font-data)" }}
          >
            ${(totalTarjeta + totalTransferencia).toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-semibold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Filter className="w-5 h-5" />
            Filtros
          </h2>
          <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Buscar Folio/Cliente
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--color-text-muted)" }}
              />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Método de Pago
            </label>
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value)}
              style={selectStyle}
            >
              <option value="todos">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={selectStyle}
            >
              <option value="todos">Todos</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Fecha Inicio
            </label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Fecha Fin
            </label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Tabla de Ventas */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              style={{
                background: "var(--color-bg-elevated)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <tr>
                {["Folio", "Fecha", "Cliente", "Vendedor", "Total", "Método", "Estado", "Acciones"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Cargando ventas...
                  </td>
                </tr>
              ) : filteredVentas.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    No se encontraron ventas
                  </td>
                </tr>
              ) : (
                filteredVentas.map((venta) => (
                  <VentaRow
                    key={venta.id}
                    venta={venta}
                    onVerDetalle={handleVerDetalle}
                    onDescargar={handleDescargarRecibo}
                    onCancelar={handleCancelarVenta}
                    onDevolver={handleDevolver}
                    isAdmin={isAdmin}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detalle */}
      {showDetalleModal && ventaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                Detalle de Venta
              </h2>
              <button
                onClick={() => setShowDetalleModal(false)}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--color-bg-elevated)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                style={{ padding: "8px", borderRadius: "0.5rem" }}
              >
                <X className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Info general */}
              <div
                className="grid grid-cols-2 gap-4 pb-4"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <div>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Folio
                  </p>
                  <p
                    className="font-semibold"
                    style={{
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {ventaSeleccionada.folio}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Fecha
                  </p>
                  <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {new Date(ventaSeleccionada.fechaVenta).toLocaleString("es-MX")}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Vendedor
                  </p>
                  <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {ventaSeleccionada.vendedorNombre || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Cliente
                  </p>
                  <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {ventaSeleccionada.clienteNombre
                      ? `${ventaSeleccionada.clienteNombre} ${ventaSeleccionada.clienteApellido || ""}`
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3
                  className="font-semibold mb-3"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Productos
                </h3>
                <div className="space-y-2">
                  {(ventaSeleccionada.items || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between p-3 rounded-lg"
                      style={{ background: "var(--color-bg-elevated)" }}
                    >
                      <div>
                        <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {item.productoNombre}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {item.cantidad} x ${item.precioUnitario.toFixed(2)}
                        </p>
                      </div>
                      <p
                        className="font-semibold"
                        style={{
                          color: "var(--color-text-primary)",
                          fontFamily: "var(--font-data)",
                        }}
                      >
                        ${item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div
                className="pt-4 space-y-2"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-secondary)" }}>Subtotal:</span>
                  <span
                    className="font-medium"
                    style={{
                      color: "var(--color-text-primary)",
                      fontFamily: "var(--font-data)",
                    }}
                  >
                    ${ventaSeleccionada.subtotal.toFixed(2)}
                  </span>
                </div>
                {ventaSeleccionada.descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--color-text-secondary)" }}>Descuento:</span>
                    <span
                      className="font-medium"
                      style={{ color: "var(--color-danger)", fontFamily: "var(--font-data)" }}
                    >
                      -${ventaSeleccionada.descuento.toFixed(2)}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between pt-2"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    Total:
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: "var(--color-success)", fontFamily: "var(--font-data)" }}
                  >
                    ${ventaSeleccionada.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Método de pago */}
              <div className="pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Método de pago:{" "}
                  <span
                    className="font-medium capitalize"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {ventaSeleccionada.metodoPago}
                  </span>
                </p>
                {ventaSeleccionada.metodoPago === "efectivo" &&
                  ventaSeleccionada.cambio !== undefined && (
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Cambio: ${ventaSeleccionada.cambio.toFixed(2)}
                    </p>
                  )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() =>
                    handleDescargarRecibo(ventaSeleccionada.id, ventaSeleccionada.folio)
                  }
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Recibo
                </Button>
                {isAdmin && ventaSeleccionada.estado === "completada" && (
                  <Button
                    variant="danger"
                    onClick={() =>
                      handleCancelarVenta(ventaSeleccionada.id, ventaSeleccionada.folio)
                    }
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* FASE 33: Modal Devolución */}
      {showDevolucionModal && ventaParaDevolver && (
        <DevolucionModal
          venta={ventaParaDevolver}
          isOpen={showDevolucionModal}
          onClose={() => {
            setShowDevolucionModal(false);
            setVentaParaDevolver(null);
          }}
          onDevolucionCreada={handleDevolucionCreada}
        />
      )}
    </div>
  );
}
