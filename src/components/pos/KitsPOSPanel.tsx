"use client";

import { useState, useEffect, useCallback } from "react";
import { useDistribuidor } from "@/components/DistribuidorProvider";
import { Package2, Search, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import type { Kit } from "@/types";
import type { CartItem } from "./ShoppingCart";

interface KitsPOSPanelProps {
  onAgregarKit: (item: CartItem) => void;
}

export function KitsPOSPanel({ onAgregarKit }: KitsPOSPanelProps) {
  const { distribuidorActivo } = useDistribuidor();
  const [kits, setKits]         = useState<Kit[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);

  const fetchKits = useCallback(async () => {
    setLoading(true);
    try {
      const hdrs: Record<string, string> = {};
      if (distribuidorActivo?.id) hdrs["X-Distribuidor-Id"] = distribuidorActivo.id;
      const res  = await fetch("/api/kits?activos=true", { headers: hdrs });
      const json = await res.json();
      setKits(json.data ?? []);
    } catch {
      setKits([]);
    } finally {
      setLoading(false);
    }
  }, [distribuidorActivo]);

  useEffect(() => { fetchKits(); }, [fetchKits]);

  const filtrados = kits.filter((k) =>
    !query || k.nombre.toLowerCase().includes(query.toLowerCase())
  );

  function handleAgregar(kit: Kit) {
    // Verificar que todos los items tengan stock suficiente
    const sinStock = (kit.items ?? []).find(
      (i) => (i.producto?.stock ?? 0) < i.cantidad
    );
    if (sinStock) {
      alert(`Sin stock suficiente: ${sinStock.producto?.nombre ?? sinStock.productoId}`);
      return;
    }

    const item: CartItem = {
      esKit:          true,
      kitId:          kit.id,
      kitNombre:      kit.nombre,
      kitItems:       (kit.items ?? []).map((i) => ({
        productoId: i.productoId,
        nombre:     i.producto?.nombre ?? i.productoId,
        marca:      i.producto?.marca ?? "",
        cantidad:   i.cantidad,
        stock:      i.producto?.stock ?? 0,
      })),
      cantidad:       1,
      precioUnitario: kit.precio,
      subtotal:       kit.precio,
    };
    onAgregarKit(item);
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse" style={{ height: 64, background: "var(--color-bg-elevated)", borderRadius: "var(--radius-md)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Búsqueda */}
      <div style={{ position: "relative" }}>
        <Search style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--color-text-muted)", pointerEvents: "none" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar kit..."
          style={{
            width: "100%", paddingLeft: "2rem", paddingRight: "0.75rem",
            paddingTop: "0.4375rem", paddingBottom: "0.4375rem",
            background: "var(--color-bg-sunken)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-primary)", fontSize: "0.875rem", outline: "none",
          }}
        />
      </div>

      {filtrados.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--color-text-muted)" }}>
          <Package2 className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-border)" }} />
          <p style={{ fontSize: "0.875rem" }}>
            {query ? "Sin resultados" : "No hay kits activos"}
          </p>
          {!query && (
            <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
              Crea kits en Productos → Kits
            </p>
          )}
        </div>
      )}

      {filtrados.map((kit) => {
        const isExp = expandido === kit.id;
        const sinStock = (kit.items ?? []).some(
          (i) => (i.producto?.stock ?? 0) < i.cantidad
        );

        return (
          <div
            key={kit.id}
            style={{
              background: "var(--color-bg-surface)",
              border: `1px solid ${sinStock ? "var(--color-warning)" : "var(--color-border-subtle)"}`,
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            {/* Fila principal */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 0.75rem" }}>
              {/* Ícono */}
              <div style={{
                width: 36, height: 36, borderRadius: "var(--radius-md)",
                background: "var(--color-accent-light)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Package2 style={{ width: 18, height: 18, color: "var(--color-accent)" }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {kit.nombre}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {(kit.items ?? []).length} productos · {sinStock && <span style={{ color: "var(--color-warning)" }}>Sin stock</span>}
                </p>
              </div>

              {/* Precio */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: "var(--font-data)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text-primary)" }}>
                  ${kit.precio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Chevron para expandir */}
              <button
                onClick={() => setExpandido(isExp ? null : kit.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.25rem" }}
              >
                {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Botón Agregar */}
              <button
                onClick={() => handleAgregar(kit)}
                disabled={sinStock}
                style={{
                  padding: "0.375rem 0.875rem",
                  background: sinStock ? "var(--color-bg-elevated)" : "var(--color-accent)",
                  color: sinStock ? "var(--color-text-muted)" : "#fff",
                  border: "none", borderRadius: "var(--radius-md)",
                  fontSize: "0.8125rem", fontWeight: 600,
                  cursor: sinStock ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  transition: "background 150ms ease",
                }}
              >
                + Agregar
              </button>
            </div>

            {/* Panel expandido con los items del kit */}
            {isExp && (
              <div style={{
                padding: "0.5rem 0.75rem 0.75rem",
                borderTop: "1px solid var(--color-border-subtle)",
                background: "var(--color-bg-base)",
              }}>
                {kit.descripcion && (
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                    {kit.descripcion}
                  </p>
                )}
                <div className="space-y-1">
                  {(kit.items ?? []).map((ki) => {
                    const stockOk = (ki.producto?.stock ?? 0) >= ki.cantidad;
                    return (
                      <div key={ki.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ki.producto?.marca} {ki.producto?.nombre}
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>×{ki.cantidad}</span>
                          <span style={{
                            fontSize: "0.6875rem", padding: "0.1rem 0.4rem",
                            background: stockOk ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                            color: stockOk ? "var(--color-success-text)" : "var(--color-danger-text)",
                            borderRadius: "9999px", fontWeight: 600,
                          }}>
                            Stock: {ki.producto?.stock ?? 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Botón refrescar */}
      <button
        onClick={fetchKits}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
          padding: "0.4375rem", background: "transparent",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-text-muted)", fontSize: "0.75rem", cursor: "pointer",
        }}
      >
        <RefreshCw className="w-3.5 h-3.5" /> Actualizar kits
      </button>
    </div>
  );
}
