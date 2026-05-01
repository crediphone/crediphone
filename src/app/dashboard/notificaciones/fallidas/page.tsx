"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  AlertTriangle, CheckCircle2, RefreshCw, Send, ChevronLeft, Phone, MessageSquare,
} from "lucide-react";
import type { CSSProperties } from "react";

interface NotifFallida {
  id: string;
  tipo: string;
  canal: string | null;
  telefono: string | null;
  mensaje: string | null;
  error: string | null;
  intentos: number;
  resuelto: boolean;
  resuelto_at: string | null;
  created_at: string;
  orden: { id: string; folio: string; estado: string } | null;
}

function fmtFecha(d: string) {
  return new Date(d).toLocaleString("es-MX", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function NotificacionesFallidasPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [fallidas, setFallidas] = useState<NotifFallida[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolviendoId, setResolviendoId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Record<string, string>>({});

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const fetchFallidas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notificaciones/fallidas");
      const data = await res.json();
      if (data.success) setFallidas(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchFallidas();
  }, [fetchFallidas, isAdmin]);

  const handleResolver = async (id: string) => {
    setResolviendoId(id);
    try {
      const res = await fetch(`/api/notificaciones/fallidas/${id}/resolver`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMensajes(prev => ({ ...prev, [id]: data.reintentado ? "Reenviado ✓" : "Marcado como resuelto ✓" }));
        await fetchFallidas();
      } else {
        setMensajes(prev => ({ ...prev, [id]: `Error: ${data.error}` }));
      }
    } finally {
      setResolviendoId(null);
    }
  };

  if (!isAdmin) {
    return <div className="p-8 text-center" style={{ color: "var(--color-text-secondary)" }}>Sin acceso.</div>;
  }

  const inputStyle: CSSProperties = {
    background: "var(--color-bg-sunken)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <AlertTriangle size={20} style={{ color: "var(--color-danger)" }} />
          Notificaciones fallidas
        </h1>
        <button
          onClick={fetchFallidas}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
          style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {loading && fallidas.length === 0 ? (
        <div className="flex items-center justify-center h-40" style={{ color: "var(--color-text-secondary)" }}>
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : fallidas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2" style={{ color: "var(--color-text-secondary)" }}>
          <CheckCircle2 size={32} style={{ color: "var(--color-success)" }} />
          <p className="text-sm">No hay notificaciones fallidas pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fallidas.map((nf) => (
            <div
              key={nf.id}
              className="rounded-2xl p-4 space-y-3"
              style={{
                background: "var(--color-bg-elevated)",
                border: `1px solid ${nf.resuelto ? "var(--color-border)" : "var(--color-danger)44"}`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {nf.tipo === "whatsapp" ? <Phone size={14} style={{ color: "var(--color-success)" }} /> : <MessageSquare size={14} />}
                    <span className="text-sm font-medium font-mono" style={{ color: "var(--color-text-primary)" }}>
                      {nf.tipo.toUpperCase()} → {nf.canal ?? "cliente"}
                    </span>
                    {nf.orden && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: "var(--color-bg-sunken)", color: "var(--color-text-secondary)" }}>
                        {nf.orden.folio}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                      {fmtFecha(nf.created_at)} · {nf.intentos} intento{nf.intentos !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {nf.telefono && (
                    <p className="text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>
                      Tel: {nf.telefono}
                    </p>
                  )}
                  {nf.error && (
                    <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                      Error: {nf.error}
                    </p>
                  )}
                </div>
                {!nf.resuelto ? (
                  <button
                    onClick={() => handleResolver(nf.id)}
                    disabled={resolviendoId === nf.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0"
                    style={{ background: "var(--color-accent)", color: "#fff", opacity: resolviendoId === nf.id ? 0.7 : 1 }}
                  >
                    <Send size={12} />
                    {resolviendoId === nf.id ? "Enviando…" : nf.tipo === "whatsapp" ? "Reenviar WA" : "Marcar resuelta"}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-xl" style={{ background: "var(--color-success-bg)", color: "var(--color-success-text)" }}>
                    <CheckCircle2 size={12} /> Resuelta
                  </span>
                )}
              </div>
              {mensajes[nf.id] && (
                <p className="text-xs font-medium" style={{ color: "var(--color-success-text)" }}>{mensajes[nf.id]}</p>
              )}
              {nf.mensaje && (
                <details>
                  <summary className="text-xs cursor-pointer" style={{ color: "var(--color-text-tertiary)" }}>Ver mensaje</summary>
                  <pre className="mt-2 text-xs whitespace-pre-wrap rounded-lg p-3" style={inputStyle}>{nf.mensaje}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
