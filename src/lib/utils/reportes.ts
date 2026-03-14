/**
 * FASE 31: Utilidades para generar Reporte X y Reporte Z
 * Abre una ventana nueva con HTML para imprimir
 */

// =====================================================
// TIPOS INTERNOS DE REPORTE
// =====================================================

export interface ReporteSesionData {
  sesion: {
    id: string;
    folio: string;
    estado: string;
    monto_inicial: number;
    monto_final?: number;
    monto_esperado?: number;
    diferencia?: number;
    fecha_apertura: string;
    fecha_cierre?: string;
    notas_apertura?: string;
    notas_cierre?: string;
    total_ventas_efectivo?: number;
    total_ventas_transferencia?: number;
    total_ventas_tarjeta?: number;
    total_retiros?: number;
    total_depositos?: number;
    numero_ventas?: number;
    users?: { name?: string };
  };
  movimientos: Array<{
    id: string;
    tipo: string;
    monto: number;
    concepto: string;
    createdAt: Date | string;
  }>;
  ventas: Array<{
    id: string;
    folio: string;
    total: number;
    subtotal: number;
    descuento: number;
    metodoPago: string;
    desgloseMixto?: { efectivo?: number; transferencia?: number; tarjeta?: number };
    estado: string;
    fechaVenta: Date | string;
    vendedorNombre?: string;
    clienteNombre?: string;
    items?: Array<{
      productoNombre: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
      imei?: string;
    }>;
  }>;
  distribuidorNombre: string;
}

// =====================================================
// HELPERS DE FORMATO
// =====================================================

function fmt(num: number | undefined | null): string {
  const n = typeof num === "number" ? num : 0;
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtHora(date: Date | string): string {
  return new Date(date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function fmtFecha(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function metodoPagoLabel(metodo: string): string {
  switch (metodo) {
    case "efectivo": return "Efectivo";
    case "transferencia": return "Transferencia";
    case "tarjeta": return "Tarjeta";
    case "mixto": return "Mixto";
    default: return metodo;
  }
}

// =====================================================
// ESTILOS COMUNES DEL REPORTE (print-friendly)
// =====================================================

const CSS_COMUN = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #1a1a1a;
    background: white;
    padding: 20px;
    max-width: 600px;
    margin: 0 auto;
  }
  .header { text-align: center; margin-bottom: 16px; }
  .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
  .header h2 { font-size: 13px; font-weight: normal; margin-top: 4px; }
  .header .folio { font-size: 14px; font-weight: bold; margin-top: 6px; letter-spacing: 1px; }
  .header .tipo-reporte {
    display: inline-block;
    border: 2px solid #1a1a1a;
    padding: 2px 12px;
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 2px;
    margin-top: 6px;
  }
  .divider { border-top: 1px dashed #666; margin: 10px 0; }
  .divider-solid { border-top: 2px solid #1a1a1a; margin: 10px 0; }
  .row { display: flex; justify-content: space-between; margin: 3px 0; }
  .row .label { color: #555; }
  .row .value { font-weight: bold; }
  .row .value.mono { font-family: 'Courier New', monospace; }
  .section-title { font-weight: bold; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; margin: 10px 0 6px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; font-weight: bold; padding: 3px 4px; border-bottom: 1px solid #1a1a1a; }
  th.right { text-align: right; }
  td { padding: 3px 4px; vertical-align: top; border-bottom: 1px solid #e0e0e0; }
  td.right { text-align: right; }
  td.mono { font-family: 'Courier New', monospace; font-size: 10px; }
  .totales { background: #f5f5f5; }
  .totales td { font-weight: bold; border-top: 2px solid #1a1a1a; }
  .total-final { font-size: 15px; font-weight: bold; text-align: right; margin: 10px 0; }
  .badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: bold;
  }
  .diferencia-positiva { color: #15803d; }
  .diferencia-negativa { color: #b91c1c; }
  .diferencia-cero { color: #1d4ed8; }
  .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #888; }
  .print-btn {
    display: block;
    margin: 16px auto;
    padding: 10px 32px;
    background: #09244a;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    letter-spacing: 1px;
  }
  .print-btn:hover { background: #0e3570; }
  @media print {
    .print-btn { display: none; }
    body { padding: 0; }
  }
`;

// =====================================================
// GENERADOR REPORTE X (turno abierto — sin cerrar)
// =====================================================

export function generarReporteX(data: ReporteSesionData): string {
  const { sesion, movimientos, ventas, distribuidorNombre } = data;

  const totalEfectivo = sesion.total_ventas_efectivo ?? 0;
  const totalTransferencia = sesion.total_ventas_transferencia ?? 0;
  const totalTarjeta = sesion.total_ventas_tarjeta ?? 0;
  const totalDepositos = sesion.total_depositos ?? 0;
  const totalRetiros = sesion.total_retiros ?? 0;
  const numVentas = sesion.numero_ventas ?? ventas.filter(v => v.estado === "completada").length;

  // Calcular totales en vivo desde las ventas (sesión abierta no los tiene en DB)
  let efvo = 0, transf = 0, tarj = 0, nv = 0;
  ventas.filter(v => v.estado === "completada").forEach(v => {
    nv++;
    const t = typeof v.total === "number" ? v.total : parseFloat(v.total as unknown as string || "0");
    switch (v.metodoPago) {
      case "efectivo": efvo += t; break;
      case "transferencia": transf += t; break;
      case "tarjeta": tarj += t; break;
      case "mixto":
        efvo += v.desgloseMixto?.efectivo || 0;
        transf += v.desgloseMixto?.transferencia || 0;
        tarj += v.desgloseMixto?.tarjeta || 0;
        break;
    }
  });

  const montoEsperado = sesion.monto_inicial + efvo + totalDepositos - totalRetiros;

  const ventasRows = ventas.filter(v => v.estado === "completada").map(v => {
    const t = typeof v.total === "number" ? v.total : parseFloat(v.total as unknown as string || "0");
    return `
      <tr>
        <td class="mono">${v.folio}</td>
        <td class="mono">${fmtHora(v.fechaVenta)}</td>
        <td>${metodoPagoLabel(v.metodoPago)}</td>
        <td class="right mono">${fmt(t)}</td>
      </tr>
    `;
  }).join("");

  const movRows = movimientos.map(m => `
    <tr>
      <td>${m.tipo === "deposito" ? "↑ Depósito" : "↓ Retiro"}</td>
      <td>${m.concepto}</td>
      <td class="right mono">${m.tipo === "deposito" ? "+" : "-"}${fmt(m.monto)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte X — ${sesion.folio}</title>
  <style>${CSS_COMUN}</style>
</head>
<body>
  <div class="header">
    <h1>CREDIPHONE</h1>
    ${distribuidorNombre ? `<h2>${distribuidorNombre}</h2>` : ""}
    <div class="tipo-reporte">REPORTE X — CORTE PARCIAL</div>
    <div class="folio">Turno: ${sesion.folio}</div>
  </div>

  <button class="print-btn" onclick="window.print()">🖨 Imprimir Reporte X</button>

  <div class="divider-solid"></div>

  <div class="row"><span class="label">Fecha:</span><span class="value">${fmtFecha(sesion.fecha_apertura)}</span></div>
  <div class="row"><span class="label">Apertura:</span><span class="value mono">${fmtHora(sesion.fecha_apertura)}</span></div>
  <div class="row"><span class="label">Cajero:</span><span class="value">${sesion.users?.name || "—"}</span></div>
  <div class="row"><span class="label">Estado:</span><span class="value">🔓 Turno Abierto</span></div>

  <div class="divider"></div>

  <p class="section-title">Resumen de Ventas</p>
  <div class="row"><span class="label">Núm. ventas:</span><span class="value mono">${nv}</span></div>
  <div class="row"><span class="label">Efectivo:</span><span class="value mono">${fmt(efvo)}</span></div>
  <div class="row"><span class="label">Transferencia:</span><span class="value mono">${fmt(transf)}</span></div>
  <div class="row"><span class="label">Tarjeta:</span><span class="value mono">${fmt(tarj)}</span></div>
  <div class="divider"></div>
  <div class="row"><span class="label">Total Ventas:</span><span class="value mono">${fmt(efvo + transf + tarj)}</span></div>

  <div class="divider"></div>

  <p class="section-title">Flujo de Caja</p>
  <div class="row"><span class="label">Monto Inicial:</span><span class="value mono">${fmt(sesion.monto_inicial)}</span></div>
  <div class="row"><span class="label">+ Ventas Efectivo:</span><span class="value mono">${fmt(efvo)}</span></div>
  ${totalDepositos > 0 ? `<div class="row"><span class="label">+ Depósitos:</span><span class="value mono">${fmt(totalDepositos)}</span></div>` : ""}
  ${totalRetiros > 0 ? `<div class="row"><span class="label">- Retiros:</span><span class="value mono">${fmt(totalRetiros)}</span></div>` : ""}
  <div class="divider-solid"></div>
  <div class="row"><span class="label">Efectivo Esperado en Caja:</span><span class="value mono">${fmt(montoEsperado)}</span></div>

  ${ventas.filter(v => v.estado === "completada").length > 0 ? `
  <div class="divider"></div>
  <p class="section-title">Detalle de Ventas (${nv})</p>
  <table>
    <thead>
      <tr>
        <th>Folio</th>
        <th>Hora</th>
        <th>Método</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${ventasRows}</tbody>
  </table>
  ` : ""}

  ${movimientos.length > 0 ? `
  <div class="divider"></div>
  <p class="section-title">Movimientos de Caja</p>
  <table>
    <thead>
      <tr><th>Tipo</th><th>Concepto</th><th class="right">Monto</th></tr>
    </thead>
    <tbody>${movRows}</tbody>
  </table>
  ` : ""}

  <div class="divider"></div>
  <div class="footer">
    <p>⚠️ Este es un corte PARCIAL. El turno sigue abierto.</p>
    <p>Generado: ${new Date().toLocaleString("es-MX")}</p>
  </div>
</body>
</html>`;
}

// =====================================================
// GENERADOR REPORTE Z (turno cerrado — oficial)
// =====================================================

export function generarReporteZ(data: ReporteSesionData): string {
  const { sesion, movimientos, ventas, distribuidorNombre } = data;

  const efvo = sesion.total_ventas_efectivo ?? 0;
  const transf = sesion.total_ventas_transferencia ?? 0;
  const tarj = sesion.total_ventas_tarjeta ?? 0;
  const depositos = sesion.total_depositos ?? 0;
  const retiros = sesion.total_retiros ?? 0;
  const numVentas = sesion.numero_ventas ?? 0;
  const montoEsperado = sesion.monto_esperado ?? 0;
  const montoFinal = sesion.monto_final ?? 0;
  const diferencia = sesion.diferencia ?? 0;

  const duracionMs = sesion.fecha_cierre
    ? new Date(sesion.fecha_cierre).getTime() - new Date(sesion.fecha_apertura).getTime()
    : 0;
  const duracionH = Math.floor(duracionMs / (1000 * 60 * 60));
  const duracionMin = Math.floor((duracionMs % (1000 * 60 * 60)) / (1000 * 60));

  const ventasRows = ventas.filter(v => v.estado === "completada").map(v => {
    const t = typeof v.total === "number" ? v.total : parseFloat(v.total as unknown as string || "0");
    return `
      <tr>
        <td class="mono">${v.folio}</td>
        <td class="mono">${fmtHora(v.fechaVenta)}</td>
        <td>${v.clienteNombre || "—"}</td>
        <td>${metodoPagoLabel(v.metodoPago)}</td>
        <td class="right mono">${fmt(t)}</td>
      </tr>
    `;
  }).join("");

  const movRows = movimientos.map(m => `
    <tr>
      <td class="mono">${fmtHora(m.createdAt)}</td>
      <td>${m.tipo === "deposito" ? "↑ Depósito" : "↓ Retiro"}</td>
      <td>${m.concepto}</td>
      <td class="right mono">${m.tipo === "deposito" ? "+" : "-"}${fmt(m.monto)}</td>
    </tr>
  `).join("");

  const diferenciaClass = diferencia === 0
    ? "diferencia-cero"
    : diferencia > 0
    ? "diferencia-positiva"
    : "diferencia-negativa";

  const diferenciaLabel = diferencia === 0
    ? "✓ Sin diferencia"
    : diferencia > 0
    ? `+${fmt(diferencia)} (sobrante)`
    : `${fmt(diferencia)} (faltante)`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte Z — ${sesion.folio}</title>
  <style>${CSS_COMUN}</style>
</head>
<body>
  <div class="header">
    <h1>CREDIPHONE</h1>
    ${distribuidorNombre ? `<h2>${distribuidorNombre}</h2>` : ""}
    <div class="tipo-reporte">REPORTE Z — CIERRE DE TURNO</div>
    <div class="folio">Turno: ${sesion.folio}</div>
  </div>

  <button class="print-btn" onclick="window.print()">🖨 Imprimir Reporte Z</button>

  <div class="divider-solid"></div>

  <div class="row"><span class="label">Fecha:</span><span class="value">${fmtFecha(sesion.fecha_apertura)}</span></div>
  <div class="row"><span class="label">Apertura:</span><span class="value mono">${fmtHora(sesion.fecha_apertura)}</span></div>
  ${sesion.fecha_cierre ? `<div class="row"><span class="label">Cierre:</span><span class="value mono">${fmtHora(sesion.fecha_cierre)}</span></div>` : ""}
  <div class="row"><span class="label">Duración:</span><span class="value mono">${duracionH}h ${duracionMin}min</span></div>
  <div class="row"><span class="label">Cajero:</span><span class="value">${sesion.users?.name || "—"}</span></div>
  ${sesion.notas_apertura ? `<div class="row"><span class="label">Notas apertura:</span><span class="value">${sesion.notas_apertura}</span></div>` : ""}
  ${sesion.notas_cierre ? `<div class="row"><span class="label">Notas cierre:</span><span class="value">${sesion.notas_cierre}</span></div>` : ""}

  <div class="divider"></div>

  <p class="section-title">Resumen de Ventas</p>
  <div class="row"><span class="label">Núm. ventas:</span><span class="value mono">${numVentas}</span></div>
  <div class="row"><span class="label">Efectivo:</span><span class="value mono">${fmt(efvo)}</span></div>
  <div class="row"><span class="label">Transferencia:</span><span class="value mono">${fmt(transf)}</span></div>
  <div class="row"><span class="label">Tarjeta:</span><span class="value mono">${fmt(tarj)}</span></div>
  <div class="divider"></div>
  <div class="row"><span class="label">Total Ventas:</span><span class="value mono">${fmt(efvo + transf + tarj)}</span></div>

  <div class="divider"></div>

  <p class="section-title">Arqueo de Caja</p>
  <div class="row"><span class="label">Monto Inicial:</span><span class="value mono">${fmt(sesion.monto_inicial)}</span></div>
  <div class="row"><span class="label">+ Ventas Efectivo:</span><span class="value mono">${fmt(efvo)}</span></div>
  ${depositos > 0 ? `<div class="row"><span class="label">+ Depósitos:</span><span class="value mono">${fmt(depositos)}</span></div>` : ""}
  ${retiros > 0 ? `<div class="row"><span class="label">- Retiros:</span><span class="value mono">${fmt(retiros)}</span></div>` : ""}
  <div class="divider"></div>
  <div class="row"><span class="label">Monto Esperado:</span><span class="value mono">${fmt(montoEsperado)}</span></div>
  <div class="row"><span class="label">Monto Contado:</span><span class="value mono">${fmt(montoFinal)}</span></div>
  <div class="divider-solid"></div>
  <div class="row">
    <span class="label">Diferencia:</span>
    <span class="value mono ${diferenciaClass}">${diferenciaLabel}</span>
  </div>

  ${ventas.filter(v => v.estado === "completada").length > 0 ? `
  <div class="divider"></div>
  <p class="section-title">Detalle de Ventas (${numVentas})</p>
  <table>
    <thead>
      <tr>
        <th>Folio</th>
        <th>Hora</th>
        <th>Cliente</th>
        <th>Método</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${ventasRows}</tbody>
  </table>
  ` : ""}

  ${movimientos.length > 0 ? `
  <div class="divider"></div>
  <p class="section-title">Movimientos de Caja</p>
  <table>
    <thead>
      <tr><th>Hora</th><th>Tipo</th><th>Concepto</th><th class="right">Monto</th></tr>
    </thead>
    <tbody>${movRows}</tbody>
  </table>
  ` : ""}

  <div class="divider-solid"></div>
  <div class="footer">
    <p>✓ TURNO CERRADO OFICIALMENTE</p>
    <p>Generado: ${new Date().toLocaleString("es-MX")}</p>
    <p style="margin-top:6px;">____________________________</p>
    <p>Firma del responsable</p>
  </div>
</body>
</html>`;
}

// =====================================================
// FUNCIÓN PARA ABRIR REPORTE EN VENTANA NUEVA
// =====================================================

export function abrirReporte(html: string, titulo: string): void {
  const ventana = window.open("", "_blank", "width=700,height=900,scrollbars=yes");
  if (!ventana) {
    alert("Permitir popups para ver el reporte. Busca el ícono de popup bloqueado en tu navegador.");
    return;
  }
  ventana.document.write(html);
  ventana.document.close();
  ventana.document.title = titulo;
}
