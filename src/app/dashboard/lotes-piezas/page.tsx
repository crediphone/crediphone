"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Truck, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import type { LotePiezas } from "@/types";

interface KPICard {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

export default function LotesPiezasPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [lotes, setLotes] = useState<LotePiezas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [selectedLote, setSelectedLote] = useState<LotePiezas | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Verificar permisos
  useEffect(() => {
    if (!authLoading && user && !["admin", "super_admin"].includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Cargar lotes
  useEffect(() => {
    loadLotes();
  }, [filterEstado]);

  async function loadLotes() {
    try {
      setLoading(true);
      setError(null);

      const url = new URL("/api/lotes-piezas", window.location.origin);
      if (filterEstado !== "todos") {
        url.searchParams.set("estado", filterEstado);
      }

      const res = await fetch(url.toString());
      const data: ApiResponse<LotePiezas[]> = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Error cargando lotes");
      }

      setLotes(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // KPI Cards
  const kpis: KPICard[] = [
    {
      title: "En Camino",
      count: lotes.filter((l) => l.estado === "en_camino").length,
      icon: <Truck className="w-5 h-5" />,
      color: "var(--color-warning-bg)",
    },
    {
      title: "Pendientes Verificar",
      count: lotes.filter((l) => l.estado === "recibido").length,
      icon: <AlertCircle className="w-5 h-5" />,
      color: "var(--color-accent-light)",
    },
    {
      title: "Total Este Mes",
      count: lotes.filter(
        (l) =>
          new Date(l.createdAt).getMonth() === new Date().getMonth() &&
          new Date(l.createdAt).getFullYear() === new Date().getFullYear()
      ).length,
      icon: <Package className="w-5 h-5" />,
      color: "var(--color-bg-elevated)",
    },
  ];

  const estadoOptions = [
    { label: "Todos", value: "todos" },
    { label: "Pedido", value: "pedido" },
    { label: "En Camino", value: "en_camino" },
    { label: "Recibido", value: "recibido" },
    { label: "Verificado", value: "verificado" },
    { label: "Cancelado", value: "cancelado" },
  ];

  function getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case "pedido":
        return "bg-blue-100 text-blue-800";
      case "en_camino":
        return "bg-yellow-100 text-yellow-800";
      case "recibido":
        return "bg-cyan-100 text-cyan-800";
      case "verificado":
        return "bg-green-100 text-green-800";
      case "cancelado":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      pedido: "Pedido",
      en_camino: "En Camino",
      recibido: "Recibido",
      verificado: "Verificado",
      cancelado: "Cancelado",
    };
    return labels[estado] || estado;
  }

  if (authLoading) {
    return (
      <div
        style={{ backgroundColor: "var(--color-bg-base)" }}
        className="min-h-screen p-6"
      >
        <div className="animate-pulse space-y-4">
          <div
            style={{ backgroundColor: "var(--color-bg-surface)" }}
            className="h-12 rounded"
          />
          <div
            style={{ backgroundColor: "var(--color-bg-surface)" }}
            className="h-48 rounded"
          />
        </div>
      </div>
    );
  }

  if (!user || !["admin", "super_admin"].includes(user.role)) {
    return null;
  }

  return (
    <div
      style={{ backgroundColor: "var(--color-bg-base)" }}
      className="min-h-screen p-6"
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Lotes de Piezas
          </h1>
          <p className="text-sm text-muted mt-2">
            Gestiona órdenes de compra con distribución de costo de envío
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/lotes-piezas/nuevo")}
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-text)",
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Nuevo Lote
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "var(--color-bg-surface)",
              borderColor: "var(--color-border-subtle)",
            }}
            className="border rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  style={{ color: "var(--color-text-secondary)" }}
                  className="text-sm font-medium"
                >
                  {kpi.title}
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: "var(--color-primary)" }}>
                  {kpi.count}
                </p>
              </div>
              <div
                style={{
                  backgroundColor: kpi.color,
                  color: "var(--color-accent)",
                }}
                className="p-3 rounded-lg"
              >
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {estadoOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilterEstado(opt.value)}
            style={{
              backgroundColor:
                filterEstado === opt.value
                  ? "var(--color-primary)"
                  : "var(--color-bg-surface)",
              color:
                filterEstado === opt.value
                  ? "var(--color-primary-text)"
                  : "var(--color-text-primary)",
              borderColor:
                filterEstado === opt.value
                  ? "transparent"
                  : "var(--color-border-subtle)",
            }}
            className="px-3 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer"
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {error && (
        <div
          style={{
            backgroundColor: "var(--color-danger-bg)",
            borderColor: "var(--color-danger)",
            color: "var(--color-danger-text)",
          }}
          className="border rounded-lg p-4 mb-6"
        >
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{ backgroundColor: "var(--color-bg-surface)" }}
          className="rounded-lg border border-subtle p-6"
        >
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ backgroundColor: "var(--color-bg-elevated)" }}
                className="h-12 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : lotes.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--color-bg-surface)",
            borderColor: "var(--color-border-subtle)",
          }}
          className="border rounded-lg p-12 text-center"
        >
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No hay lotes</p>
          <p style={{ color: "var(--color-text-secondary)" }} className="text-sm mb-4">
            Comienza creando un nuevo lote de piezas
          </p>
          <button
            onClick={() => router.push("/dashboard/lotes-piezas/nuevo")}
            style={{ backgroundColor: "var(--color-primary)" }}
            className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90"
          >
            Crear Lote
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "var(--color-bg-surface)",
            borderColor: "var(--color-border-subtle)",
          }}
          className="border rounded-lg overflow-hidden shadow-sm"
        >
          <table className="w-full">
            <thead
              style={{
                backgroundColor: "var(--color-bg-elevated)",
                borderBottomColor: "var(--color-border-subtle)",
              }}
              className="border-b"
            >
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((lote) => (
                <tr
                  key={lote.id}
                  style={{
                    borderBottomColor: "var(--color-border-subtle)",
                  }}
                  className="border-b hover:bg-opacity-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedLote(lote);
                    setShowDrawer(true);
                  }}
                >
                  <td className="px-6 py-4 text-sm font-medium">
                    {lote.proveedor}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {lote.numeroPedido || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(lote.fechaPedido).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {lote.cantidadItems || 0} items
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getEstadoBadgeClass(
                        lote.estado
                      )}`}
                    >
                      {getEstadoLabel(lote.estado)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/lotes-piezas/${lote.id}`);
                      }}
                      style={{
                        color: "var(--color-accent)",
                      }}
                      className="hover:underline font-medium"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick View Drawer (simple) */}
      {showDrawer && selectedLote && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setShowDrawer(false)}
        >
          <div
            style={{
              backgroundColor: "var(--color-bg-surface)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            className="w-full md:w-96 rounded-t-lg p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {selectedLote.proveedor}
              </h2>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Pedido
                </p>
                <p className="font-mono">
                  {selectedLote.numeroPedido || "-"}
                </p>
              </div>
              <div>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Estado
                </p>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getEstadoBadgeClass(
                    selectedLote.estado
                  )}`}
                >
                  {getEstadoLabel(selectedLote.estado)}
                </span>
              </div>
              <div>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Costo Envío
                </p>
                <p className="font-mono text-lg">
                  ${selectedLote.costoEnvioTotal.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => {
                  router.push(`/dashboard/lotes-piezas/${selectedLote.id}`);
                  setShowDrawer(false);
                }}
                style={{ backgroundColor: "var(--color-primary)" }}
                className="w-full mt-4 px-4 py-2 rounded-lg text-white font-medium hover:opacity-90"
              >
                Ver Detalles Completos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
