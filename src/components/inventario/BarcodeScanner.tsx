"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, X, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface BarcodeScannerProps {
  onScan: (codigo: string) => void;
  isScanning?: boolean;
  lastScannedCode?: string;
  productName?: string;
  productImage?: string;
}

export function BarcodeScanner({
  onScan,
  isScanning = false,
  lastScannedCode,
  productName,
  productImage,
}: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup camera stream on unmount or when camera is closed
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setShowCamera(true);
      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      setCameraError(
        "No se pudo acceder a la cámara. Verifique los permisos."
      );
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Manual Input Form */}
      <form onSubmit={handleManualSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Código de Barras / SKU
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Ingrese código manualmente o use la cámara"
              disabled={isScanning}
              autoFocus
            />
            <Button
              type="submit"
              disabled={!manualInput.trim() || isScanning}
            >
              Escanear
            </Button>
          </div>
        </div>

        {/* Camera Button */}
        <div className="flex gap-2">
          {!showCamera ? (
            <Button
              type="button"
              onClick={startCamera}
              variant="secondary"
              className="w-full"
              disabled={isScanning}
            >
              <Camera className="w-4 h-4 mr-2" />
              Usar Cámara
            </Button>
          ) : (
            <Button
              type="button"
              onClick={stopCamera}
              variant="danger"
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Cerrar Cámara
            </Button>
          )}
        </div>
      </form>

      {/* Camera Error */}
      {cameraError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{cameraError}</p>
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-gray-900"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-green-500 rounded-lg"></div>
          </div>
          <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2">
            Nota: La cámara está activa para referencia visual. Ingrese el código manualmente.
          </p>
        </div>
      )}

      {/* Last Scanned Product */}
      {lastScannedCode && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Último producto escaneado
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Código: {lastScannedCode}
              </p>
              {productName && (
                <div className="mt-2 flex items-center gap-3">
                  {productImage && (
                    <img
                      src={productImage}
                      alt={productName}
                      className="w-12 h-12 object-cover rounded border border-green-300 dark:border-green-700"
                    />
                  )}
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    {productName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Instrucciones:</strong>
        </p>
        <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 ml-4 list-disc space-y-1">
          <li>Ingrese el código de barras manualmente en el campo de texto</li>
          <li>O active la cámara como referencia visual</li>
          <li>Presione &quot;Escanear&quot; para registrar el producto</li>
          <li>Los duplicados serán marcados automáticamente</li>
        </ul>
      </div>
    </div>
  );
}
