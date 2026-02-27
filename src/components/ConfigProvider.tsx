"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Configuracion, ModulosHabilitados } from "@/types";

interface ConfigContextType {
  config: Configuracion | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
  isModuleEnabled: (moduleKey: keyof ModulosHabilitados) => boolean;
}

const ConfigContext = createContext<ConfigContextType>({
  config: null,
  loading: true,
  refreshConfig: async () => {},
  isModuleEnabled: () => true,
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/configuracion");
      const data = await response.json();
      if (data.success && data.data) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      // Fall back to defaults - all modules enabled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const isModuleEnabled = useCallback(
    (moduleKey: keyof ModulosHabilitados): boolean => {
      if (!config) return true; // While loading, show everything
      return config.modulosHabilitados[moduleKey] ?? true;
    },
    [config]
  );

  return (
    <ConfigContext.Provider
      value={{ config, loading, refreshConfig: fetchConfig, isModuleEnabled }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
