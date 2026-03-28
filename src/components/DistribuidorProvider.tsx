"use client";

/**
 * DistribuidorProvider
 * Contexto de distribuidor activo para super_admin.
 *
 * - super_admin SIEMPRE arranca en CREDIPHONE Principal (primer distribuidor activo).
 *   El localStorage NO se usa para restaurar entre sesiones — solo persiste
 *   dentro de la misma sesión de navegador (sessionStorage no implementado por ahora:
 *   simplemente no se lee el localStorage al cargar).
 * - El super_admin puede cambiar a cualquier otro distribuidor o a "Vista Global" (null)
 *   desde el selector en el dashboard.
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

        // Siempre arrancar con CREDIPHONE Principal (primer distribuidor activo).
        // NO restauramos desde localStorage entre sesiones — Trini quiere entrar
        // siempre en su tienda principal por defecto (opción C).
        const primero = dists.find((d) => d.activo) ?? dists[0] ?? null;
        if (primero) {
          setDistribuidorActivoState(primero);
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
