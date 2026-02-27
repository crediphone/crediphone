"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { UserRole } from "@/types";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  fotoPerfil?: string;
  activo?: boolean;
  distribuidorId?: string; // FASE 21
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch {
        // Sin usuario autenticado
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
