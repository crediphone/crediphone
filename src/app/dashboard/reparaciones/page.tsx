"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EstadoBadge, PrioridadBadge } from "@/components/reparaciones/EstadoBadge";
import { ModalOrden } from "@/components/reparaciones/ModalOrden";
import { ModalDiagnostico } from "@/components/reparaciones/ModalDiagnostico";
import { ModalCambiarEstado } from "@/components/reparaciones/ModalCambiarEstado";
import { useAuth } from "@/components/AuthProvider";
import type {
  OrdenReparacionDetallada,
  EstadoOrdenReparacion,
} from "@/types";

export default function ReparacionesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [ordenes, setOrdenes] = useState<OrdenReparacionDetallada[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<OrdenReparacionDetallada[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEstado, setFilterEstado] = useState<EstadoOrdenReparacion | "todas" | "garantias">("todas");
  const [stats, setStats] = useState({
    total: 0,
    activas: 0,
    diagnostico: 0,
    enReparacion: 0,
    listasEntrega: 0,
    garantiasActivas: 0,
  });

  // Modal states
  const [modalOrdenOpen, setModalOrdenOpen] = useState(false);
  const [modalDiagnosticoOpen, setModalDiagnosticoOpen] = useState(false);
  const [modalCambiarEstadoOpen, setModalCambiarEstadoOpen] = useState(false);
  const [selectedOrdenForEstado, setSelectedOrdenForEstado] = useState<OrdenReparacionDetallada | null>(null);
  const [selectedOrden, setSelectedOrden] = useState<OrdenReparacionDetallada | null>(null);

  // Protección de rol — solo admin, tecnico, super_admin
  useEffect(() => {
    if (!authLoading && user && !["admin", "tecnico", "super_admin"].includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Cargar órdenes al montar (solo si tiene permisos)
  useEffect(() => {
    if (!authLoading && user && ["admin", "tecnico", "super_admin"].includes(user.role)) {
      fetchOrdenes();
    }
  }, [authLoading, user]);

  // Filtrar órdenes cuando cambian filtros o búsqueda
  useEffect(() => {
    filterOrdenes();
  }, [ordenes, searchQuery, filterEstado]);

  // Calcular stats cuando cambian las órdenes
  useEffect(() => {
    calculateStats();
  }, [ordenes]);

  async function fetchOrdenes() {
    try {
      setLoading(true);
      const response = await fetch("/api/reparaciones?detalladas=true");
      const data = await response.json();

      if (data.success) {
        setOrdenes(data.data);
      } else {
        console.error("Error al obtener órdenes:", data.error);
      }
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats() {
    const total = ordenes.length;
    const activas = ordenes.filter(
      (o) => !["entregado", "cancelado", "no_reparable"].includes(o.estado)
    ).length;
    const diagnostico = ordenes.filter((o) => o.estado === "diagnostico").length;
    const enReparacion = ordenes.filter((o) => o.estado === "en_reparacion").length;
    const listasEntrega = ordenes.filter((o) => o.estado === "listo_entrega").length;
    const garantiasActivas = ordenes.filter(
      (o) => o.esGarantia && !["entregado", "cancelado"].includes(o.estado)
    ).length;

    setStats({
      total,
      activas,
      diagnostico,
      enReparacion,
      listasEntrega,
      garantiasActivas,
    });
  }

  function filterOrdenes() {
    let filtered = ordenes;

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (orden) =>
          orden.folio.toLowerCase().includes(query) ||
          orden.clienteNombre.toLowerCase().includes(query) ||
          (orden.clienteApellido && orden.clienteApellido.toLowerCase().includes(query)) ||
          orden.marcaDispositivo.toLowerCase().includes(query) ||
          orden.modeloDispositivo.toLowerCase().includes(query) ||
          (orden.imei && orden.imei.toLowerCase().includes(query))
      );
    }

    // Filtro por estado
    if (filterEstado === "garantias") {
      filtered = filtered.filter(
        (o) => o.esGarantia && !["entregado", "cancelado"].includes(o.estado)
      );
    } else if (filterEstado !== "todas") {
      filtered = filtered.filter((o) => o.estado === filterEstado);
    }

    setFilteredOrdenes(filtered);
  }

  function formatFecha(fecha: Date | undefined): string {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  }

  function handleCambiarEstado(orden: OrdenReparacionDetallada) {
    setSelectedOrdenForEstado(orden);
    setModalCambiarEstadoOpen(true);
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          Gestión de Reparaciones
        </h1>
        <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Sistema de órdenes de servicio de reparación de celulares
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--color-bg-surface)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Total Órdenes</p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{stats.total}</p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--color-info-bg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--color-info-text)" }}>Activas</p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-info-text)" }}>{stats.activas}</p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--color-warning-bg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--color-warning-text)" }}>En Diagnóstico</p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-warning-text)" }}>{stats.diagnostico}</p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--color-accent-light)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--color-accent)" }}>En Reparación</p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-accent)" }}>{stats.enReparacion}</p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--color-success-bg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--color-success-text)" }}>Listas Entrega</p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-success-text)" }}>{stats.listasEntrega}</p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--color-warning-bg)",
            border: "2px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p className="text-sm flex items-center gap-1" style={{ color: "var(--color-warning-text)" }}>
            Garantías
          </p>
          <p className="text-2xl font-bold" style={{ color: "var(--color-warning-text)" }}>{stats.garantiasActivas}</p>
        </div>
      </div>

      {/* Toolbar: Filtros y Búsqueda */}
      <div
        className="p-4 rounded-lg mb-6"
        style={{
          background: "var(--color-bg-surface)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por folio, cliente, dispositivo, IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          {/* Filtro por estado */}
          <div className="w-full md:w-48">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              <option value="todas">Todas las órdenes</option>
              <option value="garantias">Solo Garantías</option>
              <option value="recibido">Recibido</option>
              <option value="diagnostico">En Diagnóstico</option>
              <option value="presupuesto">Presupuesto</option>
              <option value="aprobado">Aprobado</option>
              <option value="en_reparacion">En Reparación</option>
              <option value="completado">Completado</option>
              <option value="listo_entrega">Listo para Entrega</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>

          {/* Botón Nueva Orden — solo admin y super_admin */}
          {user && ["admin", "super_admin"].includes(user.role) && (
            <Button
              variant="primary"
              className="whitespace-nowrap"
              onClick={() => setModalOrdenOpen(true)}
            >
              + Nueva Orden
            </Button>
          )}
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "var(--color-bg-surface)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
            Cargando órdenes de reparación...
          </div>
        ) : filteredOrdenes.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
            {searchQuery || filterEstado !== "todas"
              ? "No se encontraron órdenes con los filtros aplicados"
              : "No hay órdenes de reparación registradas"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: "var(--color-bg-elevated)" }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    Folio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    Dispositivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    Técnico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    Fecha Recepción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrdenes.map((orden) => (
                  <tr
                    key={orden.id}
                    style={{
                      background: orden.esGarantia ? "var(--color-warning-bg)" : "transparent",
                      borderBottom: "1px solid var(--color-border-subtle)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--color-bg-elevated)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = orden.esGarantia
                        ? "var(--color-warning-bg)"
                        : "transparent";
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}
                        >
                          {orden.folio}
                        </span>
                        {orden.esGarantia && <span title="Orden en Garantía">🛡️</span>}
                        {orden.prioridad === "alta" && <span title="Prioridad Alta">⚠️</span>}
                        {orden.prioridad === "urgente" && <span title="Urgente">🔴</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                        {orden.clienteNombre} {orden.clienteApellido || ""}
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {orden.clienteTelefono}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                        {orden.marcaDispositivo} {orden.modeloDispositivo}
                      </div>
                      {orden.imei && (
                        <div
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
                        >
                          IMEI: {orden.imei}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <EstadoBadge estado={orden.estado} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: "var(--color-text-primary)" }}>
                      {orden.tecnicoNombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {formatFecha(orden.fechaRecepcion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium"
                        style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-data)" }}
                      >
                        {formatCurrency(orden.costoTotal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {/* Botón Diagnóstico (si está en recibido o diagnostico) */}
                      {(orden.estado === "recibido" ||
                        orden.estado === "diagnostico") && (
                        <button
                          onClick={() => {
                            setSelectedOrden(orden);
                            setModalDiagnosticoOpen(true);
                          }}
                          style={{ color: "var(--color-accent)" }}
                        >
                          Diagnóstico
                        </button>
                      )}

                      {/* Botón Ver detalles */}
                      <button
                        onClick={() => router.push(`/dashboard/reparaciones/${orden.id}`)}
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Ver
                      </button>

                      {/* Botón Cambiar Estado (para técnicos) */}
                      {orden.estado !== "entregado" &&
                        orden.estado !== "cancelado" &&
                        orden.estado !== "recibido" && (
                          <button
                            onClick={() => handleCambiarEstado(orden)}
                            style={{ color: "var(--color-primary-mid)" }}
                          >
                            Estado
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen de resultados */}
      {!loading && filteredOrdenes.length > 0 && (
        <div className="mt-4 text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
          Mostrando {filteredOrdenes.length} de {ordenes.length} órdenes
        </div>
      )}

      {/* Modales */}
      <ModalOrden
        isOpen={modalOrdenOpen}
        onClose={() => setModalOrdenOpen(false)}
        onSuccess={fetchOrdenes}
      />

      {selectedOrden && (
        <ModalDiagnostico
          isOpen={modalDiagnosticoOpen}
          onClose={() => {
            setModalDiagnosticoOpen(false);
            setSelectedOrden(null);
          }}
          onSuccess={fetchOrdenes}
          ordenId={selectedOrden.id}
          ordenFolio={selectedOrden.folio}
          dispositivo={`${selectedOrden.marcaDispositivo} ${selectedOrden.modeloDispositivo}`}
        />
      )}

      {selectedOrdenForEstado && (
        <ModalCambiarEstado
          isOpen={modalCambiarEstadoOpen}
          onClose={() => {
            setModalCambiarEstadoOpen(false);
            setSelectedOrdenForEstado(null);
          }}
          onSuccess={fetchOrdenes}
          ordenId={selectedOrdenForEstado.id}
          folio={selectedOrdenForEstado.folio}
          estadoActual={selectedOrdenForEstado.estado}
        />
      )}
    </div>
  );
}
