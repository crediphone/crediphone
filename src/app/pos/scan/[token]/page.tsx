"use client";

/**
 * FASE 65: Página móvil de escaneo QR Bridge
 * URL: /pos/scan/[token]
 *
 * Esta página NO requiere autenticación — la abre el empleado en su celular
 * escaneando el QR generado en la PC del POS.
 *
 * Flujo:
 * 1. Verifica que la sesión existe y está activa
 * 2. Activa la cámara para escanear códigos de barras/QR
 * 3. Cada código escaneado se envía vía POST /api/pos/scan-session/[token]
 * 4. La PC hace polling y agrega los productos al carrito
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, XCircle, Zap, Scan, RotateCcw } from "lucide-react";
import { BarcodeScanner } from "@/components/inventario/BarcodeScanner";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function PosScanPage({ params }: PageProps) {
  const [token, setToken] = useState<string>("");
  const [sessionStatus, setSessionStatus] = useState<"loading" | "active" | "expired" | "error">("loading");
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolver params async
  useEffect(() => {
    params.then(({ token: t }) => setToken(t));
  }, [params]);

  // Verificar sesión al montar
  useEffect(() => {
    if (!token) return;
    fetch(`/api/pos/scan-session/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.activa) {
          setSessionStatus("active");
        } else {
          setSessionStatus("expired");
        }
      })
      .catch(() => setSessionStatus("error"));
  }, [token]);

  // Polling cada 10s para detectar si la sesión fue cerrada desde la PC
  useEffect(() => {
    if (sessionStatus !== "active" || !token) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/pos/scan-session/${token}`);
        const d = await r.json();
        if (!d.success || !d.data?.activa) {
          setSessionStatus("expired");
        }
      } catch {
        // ignorar
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [sessionStatus, token]);

  const handleScan = useCallback(async (codigo: string) => {
    if (!codigo.trim() || sending) return;
    // Cooldown de 1.5s para evitar escaneos duplicados rápidos
    if (cooldownRef.current) return;
    cooldownRef.current = setTimeout(() => { cooldownRef.current = null; }, 1500);

    setSending(true);
    setSendError(null);
    try {
      const r = await fetch(`/api/pos/scan-session/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const d = await r.json();
      if (d.success) {
        setScannedCodes((prev) => [...prev, codigo]);
        setLastCode(codigo);
      } else if (r.status === 410) {
        setSessionStatus("expired");
      } else {
        setSendError("Error al enviar el código");
      }
    } catch {
      setSendError("Sin conexión — verifica tu red");
    } finally {
      setSending(false);
    }
  }, [token, sending]);

  // ── Pantalla de carga ────────────────────────────────────────────────────────
  if (!token || sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center text-white space-y-3">
          <div className="animate-spin w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-gray-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // ── Sesión expirada / error ────────────────────────────────────────────────
  if (sessionStatus === "expired" || sessionStatus === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6">
        <div className="text-center text-white space-y-4 max-w-sm">
          <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold">
            {sessionStatus === "expired" ? "Sesión expirada" : "Sesión no encontrada"}
          </h2>
          <p className="text-sm text-gray-400">
            {sessionStatus === "expired"
              ? "Esta sesión de escaneo ya fue cerrada o expiró. Genera un nuevo QR desde la PC."
              : "No se encontró la sesión. Verifica el código QR."}
          </p>
          {scannedCodes.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-4 text-left">
              <p className="text-xs text-gray-400 mb-2">Códigos escaneados en esta sesión:</p>
              {scannedCodes.map((c, i) => (
                <p key={i} className="text-xs text-green-400 font-mono">{c}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Sesión activa — mostrar escáner ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scan className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-semibold text-sm">POS Scanner</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400">Sesión activa</span>
        </div>
      </div>

      {/* Contador */}
      <div className="bg-gray-900 px-4 py-2 flex items-center gap-3 border-b border-gray-800">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-xs text-gray-300">
          {scannedCodes.length === 0
            ? "Escanea el código de barras de un producto"
            : `${scannedCodes.length} producto${scannedCodes.length !== 1 ? "s" : ""} enviado${scannedCodes.length !== 1 ? "s" : ""} al carrito de la PC`}
        </span>
      </div>

      {/* Último código enviado */}
      {lastCode && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-green-900/50 border border-green-700 rounded-xl px-3 py-2">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          <div>
            <p className="text-xs text-green-300 font-mono">{lastCode}</p>
            <p className="text-xs text-green-400/70">Enviado al carrito ✓</p>
          </div>
        </div>
      )}

      {/* Error de envío */}
      {sendError && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-red-900/50 border border-red-700 rounded-xl px-3 py-2">
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{sendError}</p>
        </div>
      )}

      {/* Escáner de cámara */}
      <div className="flex-1 px-4 pt-4 pb-6">
        <div className="rounded-xl overflow-hidden border border-gray-700">
          <BarcodeScanner
            onScan={handleScan}
            lastScannedCode={lastCode ?? undefined}
          />
        </div>
        <p className="mt-3 text-xs text-center text-gray-500">
          Apunta la cámara al código de barras o QR del producto
        </p>
      </div>

      {/* Lista de escaneados */}
      {scannedCodes.length > 0 && (
        <div className="mx-4 mb-6 bg-gray-900 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Escaneados ({scannedCodes.length})
            </p>
            <button
              onClick={() => setScannedCodes([])}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar lista
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {[...scannedCodes].reverse().map((code, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                <span className="text-xs font-mono text-green-300">{code}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
