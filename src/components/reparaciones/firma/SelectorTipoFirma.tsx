"use client";

import { useState, useRef, useEffect } from "react";
import { TipoFirma } from "@/types";

interface SelectorTipoFirmaProps {
  tipoFirma: TipoFirma | null;
  firmaData: string | null;
  onFirmaCapturada: (tipo: TipoFirma, firma: string) => void;
  nombreInicial?: string;
}

export function SelectorTipoFirma({
  tipoFirma,
  firmaData,
  onFirmaCapturada,
  nombreInicial = "",
}: SelectorTipoFirmaProps) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoFirma | null>(
    tipoFirma
  );
  const [nombreDigital, setNombreDigital] = useState(
    tipoFirma === "digital" && firmaData ? firmaData : nombreInicial
  );
  const [dibujando, setDibujando] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [firmaCapturaManuscrita, setFirmaCapturaManuscrita] = useState(false);

  useEffect(() => {
    if (!firmaData && nombreInicial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNombreDigital(nombreInicial);
    }
  }, [nombreInicial, firmaData]);

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 200;

  useEffect(() => {
    if (tipoSeleccionado === "manuscrita" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx && firmaData && tipoFirma === "manuscrita") {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); };
        img.src = firmaData;
      } else if (ctx && !firmaCapturaManuscrita) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoSeleccionado]);

  const handleTipoChange = (tipo: TipoFirma) => {
    setTipoSeleccionado(tipo);
    if (canvasRef.current && tipo === "manuscrita") {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      setFirmaCapturaManuscrita(false);
    }
    if (tipo === "digital" && !nombreDigital && nombreInicial) {
      setNombreDigital(nombreInicial);
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

  /**
   * Convierte coordenadas del viewport → coordenadas internas del canvas.
   * Corrige correctamente: DPR, scroll, padding del contenedor, scale CSS.
   */
  const toCanvasCoords = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return { canvas, ctx };
  };

  /**
   * POINTER EVENTS — maneja mouse, dedo y stylus con un solo set de eventos.
   * Más confiable en móvil que touch events separados.
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pair = getCtx();
    if (!pair) return;
    const { canvas, ctx } = pair;

    // Capturar el pointer para recibir eventos aunque salga del canvas
    canvas.setPointerCapture(e.pointerId);

    setDibujando(true);
    setFirmaCapturaManuscrita(true);

    const { x, y } = toCanvasCoords(canvas, e.clientX, e.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando) return;
    e.preventDefault();
    const pair = getCtx();
    if (!pair) return;
    const { canvas, ctx } = pair;

    const { x, y } = toCanvasCoords(canvas, e.clientX, e.clientY);
    ctx.lineTo(x, y);
    ctx.stroke();
    // Continuar el trazo desde la posición actual
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
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
      <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
        <span>✍️</span>
        <span>Firma del Cliente</span>
      </h3>

      {/* Selector de tipo */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleTipoChange("digital")}
          className="p-4 rounded-lg transition-all text-center"
          style={{
            border: tipoSeleccionado === "digital" ? "2px solid var(--color-accent)" : "2px solid var(--color-border)",
            background: tipoSeleccionado === "digital" ? "var(--color-accent-light)" : "var(--color-bg-surface)",
          }}
        >
          <div className="text-3xl mb-2">⌨️</div>
          <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Firma Digital
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Nombre en cursiva
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleTipoChange("manuscrita")}
          className="p-4 rounded-lg transition-all text-center"
          style={{
            border: tipoSeleccionado === "manuscrita" ? "2px solid var(--color-accent)" : "2px solid var(--color-border)",
            background: tipoSeleccionado === "manuscrita" ? "var(--color-accent-light)" : "var(--color-bg-surface)",
          }}
        >
          <div className="text-3xl mb-2">✍️</div>
          <div className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Firma Manuscrita
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Mouse o dedo
          </div>
        </button>
      </div>

      {/* Área de captura según el tipo */}
      {tipoSeleccionado === "digital" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
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
              className="w-full px-4 py-2 rounded-lg focus:outline-none"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-bg-sunken)", color: "var(--color-text-primary)" }}
            />
          </div>

          {nombreDigital && (
            <div className="rounded-lg p-8 text-center" style={{ background: "var(--color-bg-surface)", border: "2px solid var(--color-border)" }}>
              <div className="text-3xl font-serif italic" style={{ color: "var(--color-text-primary)" }}>
                {nombreDigital}
              </div>
              <div className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>Vista previa</div>
            </div>
          )}

          <button
            type="button"
            onClick={guardarFirmaDigital}
            disabled={!nombreDigital.trim()}
            className="w-full text-white py-3 rounded-lg transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "var(--color-accent)" }}
            onMouseEnter={e => { if (nombreDigital.trim()) (e.currentTarget.style.background = "var(--color-accent-hover)"); }}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--color-accent)")}
          >
            Guardar Firma Digital
          </button>
        </div>
      )}

      {tipoSeleccionado === "manuscrita" && (
        <div className="space-y-3">
          <div className="rounded p-2 text-xs" style={{ background: "var(--color-accent-light)", border: "1px solid var(--color-accent)", color: "var(--color-accent)" }}>
            ℹ️ Dibuja tu firma con el dedo, stylus o mouse — funciona en cualquier dispositivo
          </div>

          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "2px solid var(--color-border)", background: "var(--color-bg-elevated)" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onDragStart={(e) => e.preventDefault()}
              className="w-full cursor-crosshair block"
              style={{
                touchAction: "none",   /* evita scroll al dibujar en móvil */
                userSelect: "none",
                background: "#ffffff",
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={limpiarCanvas}
              className="flex-1 py-2 rounded-lg transition-colors"
              style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-sunken)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--color-bg-elevated)")}
            >
              🗑️ Limpiar
            </button>
            <button
              type="button"
              onClick={guardarFirmaManuscrita}
              disabled={!firmaCapturaManuscrita}
              className="flex-1 text-white py-2 rounded-lg transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--color-accent)" }}
              onMouseEnter={e => { if (firmaCapturaManuscrita) (e.currentTarget.style.background = "var(--color-accent-hover)"); }}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--color-accent)")}
            >
              ✓ Guardar Firma
            </button>
          </div>
        </div>
      )}

      {/* Confirmación si ya hay firma guardada */}
      {tipoFirma && firmaData && (
        <div className="rounded-lg p-3" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-success)" }}>
          <div className="flex items-start gap-2">
            <span className="text-lg" style={{ color: "var(--color-success)" }}>✓</span>
            <div className="text-xs flex-1" style={{ color: "var(--color-success-text)" }}>
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

      <div className="text-xs rounded p-2" style={{ color: "var(--color-text-secondary)", background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}>
        <strong>📋 Nota legal:</strong> La firma capturada forma parte del
        contrato de reparación y tiene validez legal. Asegúrate de que el cliente
        autorice antes de capturar la firma.
      </div>
    </div>
  );
}
