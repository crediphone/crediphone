"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Credito, Cliente } from "@/types";
import { formatearMoneda, formatearFecha } from "@/lib/calculosCredito";

interface ContratoFirmaProps {
  credito: Credito;
  cliente: Cliente;
  onComplete: (firmaData: string, tipoFirma: "manuscrita" | "digital") => void;
  onCancel: () => void;
}

export function ContratoFirma({
  credito,
  cliente,
  onComplete,
  onCancel,
}: ContratoFirmaProps) {
  const [tipoFirma, setTipoFirma] = useState<"manuscrita" | "digital">("digital");
  const [firmaDigital, setFirmaDigital] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [firmaValida, setFirmaValida] = useState(false);

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && tipoFirma === "manuscrita") {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [tipoFirma]);

  // Funciones para dibujar
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setFirmaValida(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFirmaValida(false);
  };

  const handleFirmaDigitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setFirmaDigital(valor);
    setFirmaValida(valor.trim().length >= 5);
  };

  const handleSubmit = () => {
    if (tipoFirma === "manuscrita") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const firmaData = canvas.toDataURL("image/png");
      onComplete(firmaData, "manuscrita");
    } else {
      onComplete(firmaDigital, "digital");
    }
  };

  return (
    <div className="space-y-4 max-h-[85vh] overflow-y-auto">
      {/* Contenido del Contrato */}
      <Card className="bg-white">
        <div className="prose prose-sm max-w-none">
          <h2 className="text-center text-xl font-bold text-gray-900">
            CONTRATO DE CRÉDITO
          </h2>
          <p className="text-center text-sm text-gray-600">
            Folio: {credito.folio || "N/A"}
          </p>

          <div className="mt-6 space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-gray-900">1. DATOS DEL ACREDITADO</h3>
              <ul className="list-none space-y-1">
                <li><strong>Nombre:</strong> {cliente.nombre} {cliente.apellido}</li>
                <li><strong>Teléfono:</strong> {cliente.telefono}</li>
                <li><strong>Dirección:</strong> {cliente.direccion}</li>
                <li><strong>INE:</strong> {cliente.ine}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">2. CONDICIONES DEL CRÉDITO</h3>
              <ul className="list-none space-y-1">
                <li><strong>Monto Original:</strong> {formatearMoneda(credito.montoOriginal || credito.monto)}</li>
                <li><strong>Enganche ({credito.enganchePorcentaje}%):</strong> {formatearMoneda(credito.enganche || 0)}</li>
                <li><strong>Monto a Financiar:</strong> {formatearMoneda(credito.monto)}</li>
                <li><strong>Plazo:</strong> {credito.plazo} meses</li>
                <li><strong>Tasa de Interés:</strong> {credito.tasaInteres}% anual</li>
                <li><strong>Frecuencia de Pago:</strong> {credito.frecuenciaPago || "quincenal"}</li>
                <li><strong>Pago por Período:</strong> {formatearMoneda(credito.montoPago || credito.pagoQuincenal)}</li>
                <li><strong>Fecha de Inicio:</strong> {formatearFecha(credito.fechaInicio)}</li>
                <li><strong>Fecha de Fin:</strong> {formatearFecha(credito.fechaFin)}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">3. OBLIGACIONES DEL ACREDITADO</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Realizar los pagos en las fechas establecidas según la frecuencia pactada.</li>
                <li>El enganche pagado no es reembolsable una vez aceptado el crédito.</li>
                <li>En caso de retraso en los pagos, se aplicará un cargo por mora de $50.00 MXN por día.</li>
                <li>El cliente se compromete a mantener actualizados sus datos de contacto.</li>
                <li>El incumplimiento del pago puede resultar en acciones legales y reportes a burós de crédito.</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-gray-900">4. INFORMACIÓN FINANCIERA</h3>
              <ul className="list-none space-y-1">
                <li><strong>CAT (Costo Anual Total):</strong> Calculado según normativa vigente</li>
                <li><strong>Mora por Retraso:</strong> $50.00 MXN por día</li>
                <li><strong>Comisiones:</strong> Sin comisiones adicionales por apertura o administración</li>
              </ul>
            </section>

            <section className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="text-xs text-gray-700">
                <strong>DECLARACIÓN:</strong> El ACREDITADO declara haber leído y comprendido todas las
                cláusulas de este contrato, aceptando libre y voluntariamente los términos y condiciones
                establecidos en el mismo. El ACREDITADO reconoce que toda la información proporcionada es
                verídica y se compromete a cumplir con las obligaciones derivadas de este crédito.
              </p>
            </section>
          </div>
        </div>
      </Card>

      {/* Sección de Firma */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">5. FIRMA DEL ACREDITADO</h3>

        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => setTipoFirma("digital")}
            className={`flex-1 px-4 py-2 rounded-md border-2 transition-colors ${
              tipoFirma === "digital"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            ✍️ Firma Digital (Texto)
          </button>
          <button
            type="button"
            onClick={() => setTipoFirma("manuscrita")}
            className={`flex-1 px-4 py-2 rounded-md border-2 transition-colors ${
              tipoFirma === "manuscrita"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            ✏️ Firma Manuscrita
          </button>
        </div>

        {tipoFirma === "digital" ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Escriba su nombre completo como firma:
            </label>
            <input
              type="text"
              value={firmaDigital}
              onChange={handleFirmaDigitalChange}
              placeholder="Ej: Juan Pérez García"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {firmaDigital && (
              <div className="mt-4 p-6 bg-gray-50 border-2 border-gray-300 rounded-md text-center">
                <p className="text-4xl font-signature text-gray-800" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                  {firmaDigital}
                </p>
                <p className="text-xs text-gray-500 mt-2">Vista previa de la firma</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Dibuje su firma en el recuadro:
            </label>
            <div className="border-2 border-gray-300 rounded-md bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={limpiarCanvas}
              className="w-full sm:w-auto"
            >
              🗑️ Limpiar Firma
            </Button>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-600 bg-blue-50 p-3 rounded">
          <p><strong>Nota:</strong> Al firmar este contrato, usted acepta todos los términos y condiciones establecidos.</p>
          <p className="mt-1">Fecha: {new Date().toLocaleDateString("es-MX", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}</p>
        </div>
      </Card>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t sticky bottom-0 bg-white pb-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          ← Regresar
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!firmaValida}
          className="w-full sm:w-auto"
        >
          ✓ Confirmar y Guardar Contrato
        </Button>
      </div>
    </div>
  );
}
