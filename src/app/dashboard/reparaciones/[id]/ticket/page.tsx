"use client";

/**
 * Ticket físico imprimible para el taller (C2)
 *
 * Impresora térmica 58mm. Letra grande y legible.
 * Incluye QR de identificación que apunta a /reparacion/{folio}
 * para identificación rápida al momento de la entrega.
 *
 * Ruta: /dashboard/reparaciones/[id]/ticket
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import type { OrdenReparacionDetallada } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function prioridadLabel(p: string): string {
  return { normal: "Normal", urgente: "URGENTE", express: "EXPRESS" }[p] ?? p;
}

// ── Ticket component ──────────────────────────────────────────────────────────

function Ticket({ orden, baseUrl }: { orden: OrdenReparacionDetallada; baseUrl: string }) {
  const qrUrl = `${baseUrl}/reparacion/${orden.folio}`;

  return (
    <div className="ticket">

      {/* Header con QR */}
      <div className="ticket-header">
        <div className="ticket-brand-col">
          <div className="ticket-brand">CREDIPHONE</div>
          <div className="ticket-subtitle">Orden de Servicio</div>
        </div>
        <div className="ticket-qr-block">
          <QRCodeSVG value={qrUrl} size={56} level="M" />
          <div className="ticket-qr-label">Escanear al entregar</div>
        </div>
      </div>

      {/* Folio grande */}
      <div className="ticket-folio-block">
        <div className="ticket-folio-label">FOLIO</div>
        <div className="ticket-folio">{orden.folio}</div>
        <div className="ticket-fecha">
          Recibido: {formatFecha(orden.fechaRecepcion)}
        </div>
        {orden.fechaEstimadaEntrega && (
          <div className="ticket-fecha">
            Entrega est.: {formatFecha(orden.fechaEstimadaEntrega)}
          </div>
        )}
      </div>

      <div className="ticket-sep" />

      {/* Cliente */}
      <div className="ticket-section">
        <div className="ticket-label">CLIENTE</div>
        <div className="ticket-val ticket-bold ticket-lg">
          {[orden.clienteNombre, orden.clienteApellido].filter(Boolean).join(" ") || "—"}
        </div>
        {orden.clienteTelefono && (
          <div className="ticket-val ticket-mono">{orden.clienteTelefono}</div>
        )}
      </div>

      <div className="ticket-sep" />

      {/* Dispositivo */}
      <div className="ticket-section">
        <div className="ticket-label">DISPOSITIVO</div>
        <div className="ticket-val ticket-bold ticket-lg">
          {orden.marcaDispositivo} {orden.modeloDispositivo}
        </div>
        {orden.imei && (
          <div className="ticket-row">
            <span className="ticket-key">IMEI:</span>
            <span className="ticket-val ticket-mono">{orden.imei}</span>
          </div>
        )}
        {orden.numeroSerie && (
          <div className="ticket-row">
            <span className="ticket-key">Serie:</span>
            <span className="ticket-val ticket-mono">{orden.numeroSerie}</span>
          </div>
        )}
        {orden.condicionDispositivo && (
          <div className="ticket-row">
            <span className="ticket-key">Condición:</span>
            <span className="ticket-val">{orden.condicionDispositivo}</span>
          </div>
        )}
        {orden.accesoriosEntregados && (
          <div className="ticket-row">
            <span className="ticket-key">Accesorios:</span>
            <span className="ticket-val">{orden.accesoriosEntregados}</span>
          </div>
        )}
      </div>

      <div className="ticket-sep" />

      {/* Problema */}
      <div className="ticket-section">
        <div className="ticket-label">PROBLEMA REPORTADO</div>
        <div className="ticket-problema">{orden.problemaReportado}</div>
      </div>

      {/* Contraseña / patrón */}
      {(orden.patronDesbloqueo || orden.passwordDispositivo) && (
        <>
          <div className="ticket-sep" />
          <div className="ticket-section ticket-acceso">
            <div className="ticket-label">🔐 ACCESO AL DISPOSITIVO</div>
            {orden.patronDesbloqueo && (
              <div className="ticket-row">
                <span className="ticket-key">Patrón:</span>
                <span className="ticket-val ticket-mono ticket-bold">{orden.patronDesbloqueo}</span>
              </div>
            )}
            {orden.passwordDispositivo && (
              <div className="ticket-row">
                <span className="ticket-key">Contraseña:</span>
                <span className="ticket-val ticket-mono ticket-bold">{orden.passwordDispositivo}</span>
              </div>
            )}
          </div>
        </>
      )}

      <div className="ticket-sep" />

      {/* Técnico + prioridad */}
      <div className="ticket-footer-row">
        <div>
          <span className="ticket-key">Técnico: </span>
          <span className="ticket-val ticket-bold">{orden.tecnicoNombre || "Sin asignar"}</span>
        </div>
        <div className={`ticket-prioridad ticket-prioridad-${orden.prioridad}`}>
          {prioridadLabel(orden.prioridad)}
        </div>
      </div>

      {orden.esGarantia && (
        <div className="ticket-garantia">★ ORDEN EN GARANTÍA</div>
      )}

      <div className="ticket-sep" />

      {/* Firma al entregar */}
      <div className="ticket-firma-section">
        <div className="ticket-label">FIRMA AL ENTREGAR</div>
        <div className="ticket-firma-linea" />
        <div className="ticket-firma-sub">Nombre y firma del cliente</div>
      </div>

      {/* Notas de corte */}
      <div className="ticket-cut">— — — — — — — — —</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketPage() {
  const params = useParams();
  const id = params.id as string;
  const [orden, setOrden] = useState<OrdenReparacionDetallada | null>(null);
  const [error, setError] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/reparaciones/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrden(d.data);
        else setError(true);
      })
      .catch(() => setError(true));
  }, [id]);

  // Auto-imprimir cuando la orden esté cargada
  useEffect(() => {
    if (orden && baseUrl) {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [orden, baseUrl]);

  if (error) {
    return (
      <div style={{ padding: 32, fontFamily: "monospace" }}>
        Error: no se pudo cargar la orden.
      </div>
    );
  }

  if (!orden || !baseUrl) {
    return (
      <div style={{ padding: 32, fontFamily: "monospace", color: "#666" }}>
        Cargando ticket…
      </div>
    );
  }

  return (
    <>
      {/* Estilos inline — solo para esta página (print + screen) */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Courier New', Courier, monospace;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          min-height: 100vh;
        }

        .ticket {
          background: #fff;
          width: 58mm;
          padding: 5mm 4mm;
          border: 1px solid #ddd;
          box-shadow: 0 2px 8px rgba(0,0,0,.12);
        }

        /* Header: brand a la izquierda, QR a la derecha */
        .ticket-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 3mm;
          margin-bottom: 4px;
        }
        .ticket-brand-col {
          flex: 1;
        }
        .ticket-brand {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 3px;
          color: #000;
          line-height: 1.1;
        }
        .ticket-subtitle {
          font-size: 8px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #555;
          margin-top: 2px;
        }
        .ticket-qr-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .ticket-qr-label {
          font-size: 6px;
          color: #777;
          text-align: center;
          letter-spacing: 0.3px;
          line-height: 1.2;
          max-width: 56px;
        }

        /* Folio */
        .ticket-folio-block {
          text-align: center;
          margin: 5px 0 4px;
        }
        .ticket-folio-label {
          font-size: 8px;
          letter-spacing: 3px;
          color: #777;
          text-transform: uppercase;
        }
        .ticket-folio {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #000;
          line-height: 1.1;
        }
        .ticket-fecha {
          font-size: 9px;
          color: #444;
          margin-top: 1px;
        }

        .ticket-sep {
          border-top: 1.5px dashed #999;
          margin: 5px 0;
        }

        /* Secciones */
        .ticket-section { margin: 3px 0; }

        .ticket-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 2px;
        }

        .ticket-row {
          display: flex;
          gap: 3px;
          margin: 2px 0;
          line-height: 1.4;
        }
        .ticket-key {
          color: #555;
          font-size: 9px;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .ticket-val {
          color: #000;
          font-size: 10px;
          word-break: break-word;
          line-height: 1.35;
        }
        .ticket-lg    { font-size: 12px; }
        .ticket-bold  { font-weight: 700; }
        .ticket-mono  { letter-spacing: 0.5px; }

        .ticket-problema {
          font-size: 11px;
          font-weight: 600;
          color: #000;
          line-height: 1.45;
          margin-top: 3px;
          padding: 4px 6px;
          border-left: 3px solid #000;
          background: #f8f8f8;
        }

        .ticket-acceso {
          background: #fff8e1;
          padding: 4px 6px;
          border-left: 3px solid #f59e0b;
        }

        .ticket-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          margin-top: 3px;
        }

        .ticket-prioridad {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .ticket-prioridad-normal  { background: #e5e7eb; color: #374151; }
        .ticket-prioridad-urgente { background: #fef3c7; color: #92400e; }
        .ticket-prioridad-express { background: #fee2e2; color: #991b1b; }

        .ticket-garantia {
          text-align: center;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #1d4ed8;
          margin-top: 3px;
        }

        /* Firma */
        .ticket-firma-section {
          margin: 4px 0 2px;
        }
        .ticket-firma-linea {
          border-top: 1px solid #000;
          margin: 10px 4px 4px;
        }
        .ticket-firma-sub {
          text-align: center;
          font-size: 8px;
          color: #666;
          letter-spacing: 0.5px;
        }

        .ticket-cut {
          text-align: center;
          color: #bbb;
          font-size: 9px;
          margin-top: 6px;
          letter-spacing: 2px;
        }

        /* Botón imprimir — solo en pantalla */
        .print-btn {
          display: block;
          margin: 16px auto 0;
          padding: 10px 28px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 1px;
        }

        /* ESTILOS DE IMPRESIÓN */
        @media print {
          body {
            background: #fff !important;
            padding: 0 !important;
          }
          .ticket {
            width: 100%;
            border: none;
            box-shadow: none;
            padding: 2mm;
          }
          .print-btn { display: none !important; }
          @page {
            size: 58mm auto;
            margin: 2mm;
          }
        }
      `}</style>

      <Ticket orden={orden} baseUrl={baseUrl} />

      <button
        className="print-btn"
        onClick={() => window.print()}
      >
        IMPRIMIR TICKET
      </button>
    </>
  );
}
