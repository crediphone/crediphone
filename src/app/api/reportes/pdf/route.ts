import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import jsPDF from "jspdf";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const NOMBRES_ESTADO: Record<string, string> = {
  activo: "Activo",
  pagado: "Pagado",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

const NOMBRES_METODO: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  deposito: "Deposito",
  mixto: "Mixto",
};

export async function POST() {
  try {
    const supabase = createAdminClient();

    // Reutilizar misma logica de /api/reportes
    const [creditosRes, pagosRes, clientesRes] = await Promise.all([
      supabase.from("creditos").select("id, monto, estado, created_at, cliente_id, plazo, tasa_interes"),
      supabase.from("pagos").select("id, monto, fecha_pago, metodo_pago, created_at"),
      supabase.from("clientes").select("id, nombre, apellido"),
    ]);

    const creditos = creditosRes.data || [];
    const pagos = pagosRes.data || [];
    const clientes = clientesRes.data || [];

    // Calcular datos
    const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();

    // Creditos por mes
    const creditosPorMes: Array<{ mes: string; cantidad: number; monto: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const creditosMes = creditos.filter((c) => {
        const fecha = new Date(c.created_at);
        return fecha.getFullYear() === year && fecha.getMonth() === month;
      });
      creditosPorMes.push({
        mes: `${mesesNombres[month]} ${year.toString().slice(2)}`,
        cantidad: creditosMes.length,
        monto: creditosMes.reduce((sum, c) => sum + Number(c.monto || 0), 0),
      });
    }

    // Pagos por mes
    const pagosPorMes: Array<{ mes: string; cantidad: number; monto: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const pagosMes = pagos.filter((p) => {
        const fecha = new Date(p.fecha_pago || p.created_at);
        return fecha.getFullYear() === year && fecha.getMonth() === month;
      });
      pagosPorMes.push({
        mes: `${mesesNombres[month]} ${year.toString().slice(2)}`,
        cantidad: pagosMes.length,
        monto: pagosMes.reduce((sum, p) => sum + Number(p.monto || 0), 0),
      });
    }

    // Estados
    const estadosCreditos: Record<string, number> = {};
    creditos.forEach((c) => {
      const estado = c.estado || "desconocido";
      estadosCreditos[estado] = (estadosCreditos[estado] || 0) + 1;
    });

    // Metodos de pago
    const metodosPago: Record<string, number> = {};
    pagos.forEach((p) => {
      const metodo = p.metodo_pago || "otro";
      metodosPago[metodo] = (metodosPago[metodo] || 0) + 1;
    });

    // KPIs
    const creditosMesActual = creditos.filter((c) => {
      const fecha = new Date(c.created_at);
      return fecha.getFullYear() === anioActual && fecha.getMonth() === mesActual;
    });
    const pagosMesActual = pagos.filter((p) => {
      const fecha = new Date(p.fecha_pago || p.created_at);
      return fecha.getFullYear() === anioActual && fecha.getMonth() === mesActual;
    });
    const creditosActivos = creditos.filter((c) => c.estado === "activo");
    const montoTotalCreditos = creditos.reduce((sum, c) => sum + Number(c.monto || 0), 0);
    const montoTotalActivos = creditosActivos.reduce((sum, c) => sum + Number(c.monto || 0), 0);
    const tasaRecuperacion = montoTotalCreditos > 0
      ? Math.round(((montoTotalCreditos - montoTotalActivos) / montoTotalCreditos * 100) * 10) / 10
      : 0;

    // Top clientes
    const clienteMontos: Record<string, number> = {};
    creditosActivos.forEach((c) => {
      clienteMontos[c.cliente_id] = (clienteMontos[c.cliente_id] || 0) + Number(c.monto || 0);
    });
    const clientesMap = new Map(clientes.map((c) => [c.id, c]));
    const topClientes = Object.entries(clienteMontos)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([clienteId, monto]) => {
        const cliente = clientesMap.get(clienteId);
        return {
          nombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : "Desconocido",
          monto,
        };
      });

    // ===== GENERAR PDF =====
    const doc = new jsPDF();
    let y = 20;

    // ENCABEZADO
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CREDIPHONE", 105, y, { align: "center" });
    y += 10;

    doc.setFontSize(14);
    doc.text("REPORTE FINANCIERO", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generado: ${now.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`,
      105,
      y,
      { align: "center" }
    );
    y += 10;

    doc.setDrawColor(200);
    doc.line(20, y, 190, y);
    y += 10;

    // KPIs
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("INDICADORES DEL MES", 20, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const kpis = [
      ["Creditos nuevos este mes:", `${creditosMesActual.length} (${formatCurrency(creditosMesActual.reduce((s, c) => s + Number(c.monto || 0), 0))})`],
      ["Cobranza del mes:", `${pagosMesActual.length} pagos (${formatCurrency(pagosMesActual.reduce((s, p) => s + Number(p.monto || 0), 0))})`],
      ["Creditos activos:", `${creditosActivos.length} de ${creditos.length} totales`],
      ["Tasa de recuperacion:", `${tasaRecuperacion}%`],
    ];

    kpis.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 90, y);
      y += 7;
    });

    y += 8;

    // CREDITOS POR MES (tabla)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("CREDITOS POR MES (ULTIMOS 6 MESES)", 20, y);
    y += 8;

    doc.setFontSize(9);
    doc.text("Mes", 20, y);
    doc.text("Cantidad", 80, y);
    doc.text("Monto", 130, y);
    y += 2;
    doc.line(20, y, 190, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    creditosPorMes.forEach((item) => {
      doc.text(item.mes, 20, y);
      doc.text(`${item.cantidad}`, 80, y);
      doc.text(formatCurrency(item.monto), 130, y);
      y += 6;
    });

    y += 8;

    // PAGOS POR MES (tabla)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("COBRANZA POR MES (ULTIMOS 6 MESES)", 20, y);
    y += 8;

    doc.setFontSize(9);
    doc.text("Mes", 20, y);
    doc.text("Pagos", 80, y);
    doc.text("Monto Cobrado", 130, y);
    y += 2;
    doc.line(20, y, 190, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    pagosPorMes.forEach((item) => {
      doc.text(item.mes, 20, y);
      doc.text(`${item.cantidad}`, 80, y);
      doc.text(formatCurrency(item.monto), 130, y);
      y += 6;
    });

    y += 8;

    // NUEVA PAGINA SI NECESARIO
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    // DISTRIBUCION DE ESTADOS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DISTRIBUCION DE CREDITOS POR ESTADO", 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    Object.entries(estadosCreditos).forEach(([estado, cantidad]) => {
      doc.text(`${NOMBRES_ESTADO[estado] || estado}: ${cantidad}`, 20, y);
      y += 6;
    });

    y += 8;

    // METODOS DE PAGO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DISTRIBUCION DE METODOS DE PAGO", 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    Object.entries(metodosPago).forEach(([metodo, cantidad]) => {
      doc.text(`${NOMBRES_METODO[metodo] || metodo}: ${cantidad}`, 20, y);
      y += 6;
    });

    y += 8;

    // TOP CLIENTES
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    if (topClientes.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TOP 5 CLIENTES POR CREDITO ACTIVO", 20, y);
      y += 8;

      doc.setFontSize(9);
      doc.text("#", 20, y);
      doc.text("Cliente", 30, y);
      doc.text("Monto Activo", 130, y);
      y += 2;
      doc.line(20, y, 190, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      topClientes.forEach((cliente, index) => {
        doc.text(`${index + 1}`, 20, y);
        doc.text(cliente.nombre, 30, y);
        doc.text(formatCurrency(cliente.monto), 130, y);
        y += 6;
      });
    }

    // PIE
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Reporte generado automaticamente por el sistema CREDIPHONE.",
      105,
      280,
      { align: "center" }
    );

    // Generar buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const fechaStr = now.toISOString().split("T")[0];

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Reporte-CREDIPHONE-${fechaStr}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error al generar PDF de reporte:", error);
    return NextResponse.json(
      { success: false, message: "Error al generar PDF" },
      { status: 500 }
    );
  }
}
