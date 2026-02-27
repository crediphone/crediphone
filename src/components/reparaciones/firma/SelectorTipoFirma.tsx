"use client";

import { useState, useRef, useEffect } from "react";
import { TipoFirma } from "@/types";

interface SelectorTipoFirmaProps {
  tipoFirma: TipoFirma | null;
  firmaData: string | null;
  onFirmaCapturada: (tipo: TipoFirma, firma: string) => void;
}

export function SelectorTipoFirma({
  tipoFirma,
  firmaData,
  onFirmaCapturada,
}: SelectorTipoFirmaProps) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoFirma | null>(
    tipoFirma
  );
  const [nombreDigital, setNombreDigital] = useState(
    tipoFirma === "digital" && firmaData ? firmaData : ""
  );
  const [dibujando, setDibujando] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [firmaCapturaManuscrita, setFirmaCapturaManuscrita] = useState(false);

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 200;

  useEffect(() => {
    if (tipoSeleccionado === "manuscrita" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx && firmaData && tipoFirma === "manuscrita") {
        // Cargar firma existente en el canvas
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = firmaData;
      } else if (ctx && !firmaCapturaManuscrita) {
        // Limpiar canvas si es nueva firma
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }
  }, [tipoSeleccionado]);

  const handleTipoChange = (tipo: TipoFirma) => {
    setTipoSeleccionado(tipo);
    // Limpiar firma al cambiar de tipo
    if (canvasRef.current && tipo === "manuscrita") {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      setFirmaCapturaManuscrita(false);
    }
    if (tipo === "digital") {
      setNombreDigital("");
    }
  };

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setFirmaCapturaManuscrita(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setDibujando(true);
    setFirmaCapturaManuscrita(true);

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dibujando) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setDibujando(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const touch = e.touches[0];
    setDibujando(true);
    setFirmaCapturaManuscrita(true);

    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!dibujando) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const touch = e.touches[0];

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setDibujando(false);
  };

  const guardarFirmaDigital = () => {
    if (!nombreDigital.trim()) {
      alert("Por favor ingresa un nombre para la firma");
      return;
    }

    onFirmaCapturada("digital", nombreDigital.trim());
  };

  const guardarFirmaManuscrita = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!firmaCapturaManuscrita) {
      alert("Por favor dibuja tu firma en el área designada");
      return;
    }

    const firmaBase64 = canvas.toDataURL("image/png");
    onFirmaCapturada("manuscrita", firmaBase64);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <span>✍️</span>
        <span>Firma del Cliente</span>
      </h3>

      {/* Selector de tipo */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleTipoChange("digital")}
          className={`
            p-4 rounded-lg border-2 transition-all text-center
            ${
              tipoSeleccionado === "digital"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-white hover:border-blue-300"
            }
          `}
        >
          <div className="text-3xl mb-2">⌨️</div>
          <div className="text-sm font-semibold text-gray-800">
            Firma Digital
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Nombre en cursiva
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleTipoChange("manuscrita")}
          className={`
            p-4 rounded-lg border-2 transition-all text-center
            ${
              tipoSeleccionado === "manuscrita"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-white hover:border-blue-300"
            }
          `}
        >
          <div className="text-3xl mb-2">✍️</div>
          <div className="text-sm font-semibold text-gray-800">
            Firma Manuscrita
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Dibuja con el mouse
          </div>
        </button>
      </div>

      {/* Área de captura según el tipo */}
      {tipoSeleccionado === "digital" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo del cliente
            </label>
            <input
              type="text"
              value={nombreDigital}
              onChange={(e) => setNombreDigital(e.target.value)}
              placeholder="Ej: Juan Pérez García"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onDrop={(e) => e.preventDefault()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {nombreDigital && (
            <div className="bg-white border-2 border-gray-300 rounded-lg p-8 text-center">
              <div className="text-3xl font-serif italic text-gray-800">
                {nombreDigital}
              </div>
              <div className="text-xs text-gray-500 mt-2">Vista previa</div>
            </div>
          )}

          <button
            type="button"
            onClick={guardarFirmaDigital}
            disabled={!nombreDigital.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Guardar Firma Digital
          </button>
        </div>
      )}

      {tipoSeleccionado === "manuscrita" && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
            ℹ️ Dibuja tu firma en el área blanca usando el mouse o tu dedo (en
            dispositivos táctiles)
          </div>

          <div
            className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 p-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDragStart={(e) => e.preventDefault()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); setDibujando(false); }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full bg-white cursor-crosshair"
              style={{ touchAction: "none", userSelect: "none" }}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={limpiarCanvas}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              🗑️ Limpiar
            </button>
            <button
              type="button"
              onClick={guardarFirmaManuscrita}
              disabled={!firmaCapturaManuscrita}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              ✓ Guardar Firma
            </button>
          </div>
        </div>
      )}

      {/* Confirmación si ya hay firma guardada */}
      {tipoFirma && firmaData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-green-600 text-lg">✓</span>
            <div className="text-xs text-green-800 flex-1">
              <div className="font-semibold mb-1">Firma guardada correctamente</div>
              <div>
                Tipo: <strong>{tipoFirma === "digital" ? "Digital" : "Manuscrita"}</strong>
              </div>
              {tipoFirma === "digital" && (
                <div className="mt-2 text-base font-serif italic">{firmaData}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2">
        <strong>📋 Nota legal:</strong> La firma capturada forma parte del
        contrato de reparación y tiene validez legal. Asegúrate de que el cliente
        autorice antes de capturar la firma.
      </div>
    </div>
  );
}
