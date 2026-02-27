"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ImagenReparacion } from "@/types";

interface GeneradorQRFotosProps {
  ordenId: string;
  onImagenesActualizadas: (imagenes: ImagenReparacion[]) => void;
}

interface Sesion {
  id: string;
  token: string;
  ordenId: string;
  maxImagenes: number;
  expiresAt: string;
  url: string;
}

export function GeneradorQRFotos({
  ordenId,
  onImagenesActualizadas,
}: GeneradorQRFotosProps) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [imagenes, setImagenes] = useState<ImagenReparacion[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Limpiar polling al desmontar
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const generarQR = async () => {
    try {
      setCargando(true);

      const response = await fetch("/api/reparaciones/qr/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordenId }),
      });

      const data = await response.json();

      if (data.success) {
        // Si la URL es relativa (NEXT_PUBLIC_BASE_URL no configurado),
        // construirla con el origin del navegador para que funcione desde otro dispositivo
        const sesion = data.sesion;
        if (sesion.url && sesion.url.startsWith("/")) {
          sesion.url = `${window.location.origin}${sesion.url}`;
        }
        setSesion(sesion);
        iniciarPolling(data.sesion.token);
      } else {
        alert("Error al generar QR: " + data.message);
      }
    } catch (error) {
      console.error("Error al generar QR:", error);
      alert("Error al generar QR");
    } finally {
      setCargando(false);
    }
  };

  const iniciarPolling = (token: string) => {
    // Polling cada 3 segundos
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/reparaciones/qr/${token}/fotos`
        );
        const data = await response.json();

        if (data.success) {
          setImagenes(data.imagenes);
          onImagenesActualizadas(data.imagenes);
        }
      } catch (error) {
        console.error("Error en polling:", error);
      }
    }, 3000);

    setPollingInterval(interval);
  };

  const detenerSesion = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setSesion(null);
    setImagenes([]);
  };

  const calcularTiempoRestante = () => {
    if (!sesion) return "";

    const ahora = new Date();
    const expiracion = new Date(sesion.expiresAt);
    const diff = expiracion.getTime() - ahora.getTime();

    if (diff <= 0) return "Expirada";

    const minutos = Math.floor(diff / 60000);
    const segundos = Math.floor((diff % 60000) / 1000);

    return `${minutos}m ${segundos}s`;
  };

  const [tiempoRestante, setTiempoRestante] = useState("");

  useEffect(() => {
    if (sesion) {
      const timer = setInterval(() => {
        setTiempoRestante(calcularTiempoRestante());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sesion]);

  if (!sesion) {
    return (
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-2xl">📱</span>
            <div>
              <div className="font-semibold text-blue-900 mb-1">
                Captura de fotos vía QR
              </div>
              <div className="text-blue-700 text-xs">
                Genera un código QR para que el cliente tome fotos desde su
                celular. Las fotos aparecerán aquí en tiempo real.
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={generarQR}
          disabled={cargando}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
        >
          {cargando ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Generando QR...</span>
            </>
          ) : (
            <>
              <span>📱</span>
              <span>Generar Código QR</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-semibold text-green-900 flex items-center gap-2">
              <span>✓</span>
              <span>Sesión QR Activa</span>
            </div>
            <div className="text-xs text-green-700 mt-1">
              El cliente puede escanear el QR para subir fotos
            </div>
          </div>
          <button
            type="button"
            onClick={detenerSesion}
            className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg flex justify-center border-2 border-gray-200">
          <QRCodeSVG value={sesion.url} size={200} level="H" />
        </div>

        {/* URL para compartir */}
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-700 mb-1">
            O comparte este enlace:
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={sesion.url}
              readOnly
              className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded bg-gray-50 font-mono"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(sesion.url);
                alert("Enlace copiado al portapapeles");
              }}
              className="text-xs bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              📋 Copiar
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white rounded p-2 border border-gray-200">
            <div className="text-gray-600">Fotos subidas</div>
            <div className="text-lg font-bold text-blue-600">
              {imagenes.length} / {sesion.maxImagenes}
            </div>
          </div>
          <div className="bg-white rounded p-2 border border-gray-200">
            <div className="text-gray-600">Tiempo restante</div>
            <div className="text-lg font-bold text-orange-600">
              {tiempoRestante}
            </div>
          </div>
        </div>
      </div>

      {/* Galería de fotos en tiempo real */}
      {imagenes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            📸 Fotos recibidas ({imagenes.length})
          </div>
          <div className="grid grid-cols-4 gap-2">
            {imagenes.map((imagen) => (
              <div
                key={imagen.id}
                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
              >
                <img
                  src={imagen.urlImagen}
                  alt="Foto del dispositivo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-[10px] px-1 py-0.5">
                  {new Date(imagen.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {imagenes.length === 0 && (
        <div className="text-xs text-gray-500 text-center italic py-4 border border-gray-200 rounded-lg bg-gray-50">
          Esperando que el cliente suba fotos...
        </div>
      )}
    </div>
  );
}
