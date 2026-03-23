"use client";

/**
 * FASE 65: MobileScannerQR
 * Componente de la PC que genera el QR Bridge, hace polling y notifica
 * los códigos recibidos del celular para agregarlos al carrito del POS.
 *
 * Uso:
 *   <MobileScannerQR
 *     onCodigoRecibido={(codigo) => agregarProductoAlCarrito(codigo)}
 *     onClose={() => setShowQRBridge(false)}
 *   />
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Smartphone, CheckCircle, Zap, RefreshCw, Link } from "lucide-react";

interface MobileScannerQRProps {
  /** Callback con cada código que llega del celular */
  onCodigoRecibido: (codigo: string) => void;
  onClose: () => void;
}

interface ScanSession {
  token: string;
  mobileUrl: string;
  expiresAt: string;
}

export function MobileScannerQR({ onCodigoRecibido, onClose }: MobileScannerQRProps) {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [codigosRecibidos, setCodigosRecibidos] = useState<string[]>([]);
  const [ultimoCodigo, setUltimoCodigo]       = useState<string | null>(null);
  const [sessionActiva, setSessionActiva]     = useState(true);
  const [copied, setCopied] = useState(false);

  // Referencia de los códigos ya procesados para no repetirlos
  const codigosProcesados = useRef<Set<string>>(new Set());
  // índice del último código procesado
  const lastIndexRef = useRef(0);

  // Crear sesión al montar
  useEffect(() => {
    const crear = async () => {
      try {
        const r = await fetch("/api/pos/scan-session", { method: "POST" });
        const d = await r.json();
        if (d.success) {
          setSession(d.data);
          setLoading(false);
        } else {
          setError(d.error || "No se pudo crear la sesión");
          setLoading(false);
        }
      } catch {
        setError("Error de conexión");
        setLoading(false);
      }
    };
    crear();
  }, []);

  // Polling cada 1.5s mientras la sesión está activa
  useEffect(() => {
    if (!session || !sessionActiva) return;

    const poll = async () => {
      try {
        const r = await fetch(`/api/pos/scan-session/${session.token}`);
        const d = await r.json();
        if (!d.success || !d.data?.activa) {
          setSessionActiva(false);
          return;
        }
        const codigos: string[] = d.data.codigos ?? [];
        // Procesar solo los nuevos (desde lastIndexRef)
        const nuevos = codigos.slice(lastIndexRef.current);
        if (nuevos.length > 0) {
          lastIndexRef.current = codigos.length;
          for (const codigo of nuevos) {
            if (!codigosProcesados.current.has(codigo + "-" + lastIndexRef.current)) {
              onCodigoRecibido(codigo);
              setUltimoCodigo(codigo);
              setCodigosRecibidos((prev) => [...prev, codigo]);
            }
          }
        }
      } catch {
        // ignorar errores de red transitorios
      }
    };

    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionActiva]);

  // Cerrar la sesión cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (session) {
        fetch(`/api/pos/scan-session/${session.token}`, { method: "DELETE" }).catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const handleCopyUrl = useCallback(async () => {
    if (!session?.mobileUrl) return;
    try {
      await navigator.clipboard.writeText(session.mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [session]);

  const handleRenew = useCallback(async () => {
    if (!session) return;
    // Cerrar la anterior
    await fetch(`/api/pos/scan-session/${session.token}`, { method: "DELETE" }).catch(() => {});
    setLoading(true);
    setError(null);
    setCodigosRecibidos([]);
    setUltimoCodigo(null);
    lastIndexRef.current = 0;
    setSessionActiva(true);
    try {
      const r = await fetch("/api/pos/scan-session", { method: "POST" });
      const d = await r.json();
      if (d.success) { setSession(d.data); setLoading(false); }
      else { setError(d.error || "Error"); setLoading(false); }
    } catch { setError("Error de conexión"); setLoading(false); }
  }, [session]);

  return (
    // Overlay
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="rounded-xl shadow-2xl w-full max-w-sm pointer-events-auto"
        style={{ background: "var(--color-bg-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
            <h3 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Escanear con celular
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div
                className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
                style={{ borderColor: "var(--color-accent)" }}
              />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Generando sesión...
              </p>
            </div>
          ) : error ? (
            <div
              className="text-sm rounded-xl p-4 text-center"
              style={{ background: "var(--color-danger-bg)", color: "var(--color-danger-text)" }}
            >
              <p className="font-medium">Error</p>
              <p className="text-xs mt-1">{error}</p>
              <button
                onClick={handleRenew}
                className="mt-3 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "var(--color-danger)", color: "#fff" }}
              >
                Reintentar
              </button>
            </div>
          ) : session ? (
            <>
              {/* Instrucciones */}
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Escanea el QR con tu celular para abrir el escáner. Los productos se agregarán automáticamente al carrito.
              </p>

              {/* QR Code */}
              <div
                className="flex flex-col items-center gap-3 p-4 rounded-xl"
                style={{ background: "var(--color-bg-sunken)" }}
              >
                <div className="p-3 rounded-lg bg-white shadow-md">
                  <QRCodeSVG
                    value={session.mobileUrl}
                    size={160}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                {/* Estado */}
                <div className="flex items-center gap-1.5">
                  {sessionActiva ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs" style={{ color: "var(--color-success)" }}>
                        Sesión activa · escuchando...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        Sesión expirada
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Botones URL */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyUrl}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: copied ? "var(--color-success-bg)" : "var(--color-bg-elevated)",
                    color: copied ? "var(--color-success-text)" : "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <Link className="w-3.5 h-3.5" />
                  {copied ? "¡Copiado!" : "Copiar link"}
                </button>
                {!sessionActiva && (
                  <button
                    onClick={handleRenew}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: "var(--color-accent-light)",
                      color: "var(--color-accent)",
                      border: "1px solid var(--color-accent)44",
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Nuevo QR
                  </button>
                )}
              </div>

              {/* Último código recibido */}
              {ultimoCodigo && (
                <div
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)33" }}
                >
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "var(--color-success)" }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--color-success-text)" }}>
                      Último código recibido
                    </p>
                    <p
                      className="text-sm font-mono font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {ultimoCodigo}
                    </p>
                  </div>
                </div>
              )}

              {/* Contador de escaneados */}
              {codigosRecibidos.length > 0 && (
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: "var(--color-accent-light)" }}
                >
                  <Zap className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
                  <span className="text-sm" style={{ color: "var(--color-accent)" }}>
                    {codigosRecibidos.length} producto{codigosRecibidos.length !== 1 ? "s" : ""} agregado{codigosRecibidos.length !== 1 ? "s" : ""} al carrito
                  </span>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
