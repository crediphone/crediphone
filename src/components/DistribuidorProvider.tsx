"use client";

/**
 * DistribuidorProvider
 * Contexto de distribuidor activo para super_admin.
 *
 * - super_admin arranca en el primer distribuidor activo (Crediphone por defecto)
 *   y puede cambiar a cualquier otro o a "Vista Global" (null).
 * - La selección persiste en localStorage entre sesiones.
 * - Roles normales (admin/vendedor/etc.) nunca usan este contexto;
 *   su distribuidor_id viene de getAuthContext() en el servidor.
 * - Las API routes que necesiten el distribuidor activo del super_admin
 *   leen el header X-Distribuidor-Id enviado por el cliente.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/components/AuthProvider";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DistribuidorItem {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
}

interface DistribuidorContextType {
  /** null = Vista Global (ve datos de todos los distribuidores) */
  distribuidorActivo: DistribuidorItem | null;
  /** Lista de distribuidores disponibles (solo cargada para super_admin) */
  distribuidores: DistribuidorItem[];
  /** Cambia el distribuidor activo; null = Vista Global */
  setDistribuidorActivo: (d: DistribuidorItem | null) => void;
  loading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DistribuidorContext = createContext<DistribuidorContextType>({
  distribuidorActivo: null,
  distribuidores: [],
  setDistribuidorActivo: () => {},
  loading: false,
});

const LS_KEY = "crediphone_active_dist_id";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DistribuidorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [distribuidores, setDistribuidores] = useState<DistribuidorItem[]>([]);
  const [distribuidorActivo, setDistribuidorActivoState] = useState<DistribuidorItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Solo super_admin carga la lista de distribuidores
  useEffect(() => {
    if (user?.role !== "super_admin") return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch("/api/admin/distribuidores")
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !Array.isArray(data.data)) return;

        const dists: DistribuidorItem[] = data.data;
        setDistribuidores(dists);

        // Restaurar selección guardada en localStorage
        const savedId =
          typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;

        if (savedId) {
          const found = dists.find((d) => d.id === savedId);
          if (found) {
            setDistribuidorActivoState(found);
            return;
          }
        }

        // Sin selección guardada → usar el primer distribuidor activo
        const primero = dists.find((d) => d.activo) ?? dists[0] ?? null;
        if (primero) {
          setDistribuidorActivoState(primero);
          if (typeof window !== "undefined") {
            localStorage.setItem(LS_KEY, primero.id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.role]);

  const setDistribuidorActivo = useCallback((d: DistribuidorItem | null) => {
    setDistribuidorActivoState(d);
    if (typeof window !== "undefined") {
      if (d) {
        localStorage.setItem(LS_KEY, d.id);
      } else {
        localStorage.removeItem(LS_KEY);
      }
    }
  }, []);

  return (
    <DistribuidorContext.Provider
      value={{ distribuidorActivo, distribuidores, setDistribuidorActivo, loading }}
    >
      {children}
    </DistribuidorContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDistribuidor() {
  return useContext(DistribuidorContext);
}
