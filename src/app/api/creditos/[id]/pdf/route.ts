import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import jsPDF from "jspdf";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const NOMBRES_METODO: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  deposito: "Deposito",
  mixto: "Mixto",
};

const NOMBRES_FRECUENCIA: Record<string, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Obtener credito con datos del cliente
    const { data: credito, error: creditoError } = await supabase
      .from("creditos")
      .select(`
        *,
        clientes:cliente_id (
          nombre,
          apellido,
          telefono,
          direccion,
          email
        )
      `)
      .eq("id", id)
      .single();

    if (creditoError || !credito) {
      return NextResponse.json(
        { success: false, message: "Credito no encontrado" },
        { status: 404 }
      );
    }

    // Obtener pagos del credito
    const { data: pagos } = await supabase
      .from("pagos")
      .select("*")
      .eq("credito_id", id)
      .order("fecha_pago", { ascending: true });

    const listaPagos = pagos || [];
    const totalPagado = listaPagos.reduce((sum, p) => sum + Number(p.monto || 0), 0);

    // Crear PDF
    const doc = new jsPDF();
    let y = 20;

    // ENCABEZADO
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CREDIPHONE", 105, y, { align: "center" });
    y += 10;

    doc.setFontSize(14);
    doc.text("COMPROBANTE DE CREDITO", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${formatDate(new Date())}`, 105, y, { align: "center" });
    y += 12;

    // Linea separadora
    doc.setDrawColor(200);
    doc.line(20, y, 190, y);
    y += 8;

    // FOLIO Y ESTADO
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const folio = credito.folio || `CRED-${id.slice(0, 8).toUpperCase()}`;
    doc.text(`Folio: ${folio}`, 20, y);

    // Estado con color
    const estado = (credito.estado || "activo").toLowerCase();
    if (estado === "activo") {
      doc.setTextColor(16, 185, 129); // verde
    } else if (estado === "pagado") {
      doc.setTextColor(59, 130, 246); // azul
    } else if (estado === "vencido") {
      doc.setTextColor(239, 68, 68); // rojo
    } else {
      doc.setTextColor(107, 114, 128); // gris
    }
    doc.text(`Estado: ${estado.charAt(0).toUpperCase() + estado.slice(1)}`, 140, y);
    doc.setTextColor(0, 0, 0);
    y += 12;

    // DATOS DEL CLIENTE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DATOS DEL CLIENTE", 20, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (credito.clientes) {
      doc.text(`Nombre: ${credito.clientes.nombre} ${credito.clientes.apellido}`, 20, y);
      y += 6;
      doc.text(`Telefono: ${credito.clientes.telefono}`, 20, y);
      y += 6;
      if (credito.clientes.email) {
        doc.text(`Email: ${credito.clientes.email}`, 20, y);
        y += 6;
      }
      if (credito.clientes.direccion) {
        const dirLines = doc.splitTextToSize(`Direccion: ${credito.clientes.direccion}`, 170);
        doc.text(dirLines, 20, y);
        y += dirLines.length * 5 + 2;
      }
    }
    y += 8;

    // DETALLE DEL CREDITO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DETALLE DEL CREDITO", 20, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const monto = Number(credito.monto || 0);
    const enganche = Number(credito.enganche || 0);
    const tasaInteres = Number(credito.tasa_interes || 0);
    const plazo = Number(credito.plazo || 0);
    const frecuencia = credito.frecuencia_pago || "quincenal";
    const montoPago = Number(credito.monto_pago || credito.pago_quincenal || 0);

    // Tabla de datos
    const detalles = [
      ["Monto del credito:", formatCurrency(monto)],
      ...(enganche > 0 ? [["Enganche:", formatCurrency(enganche)]] : []),
      ["Tasa de interes:", `${tasaInteres}% anual`],
      ["Plazo:", `${plazo} meses`],
      ["Frecuencia de pago:", NOMBRES_FRECUENCIA[frecuencia] || frecuencia],
      ["Monto por pago:", formatCurrency(montoPago)],
      ["Fecha inicio:", formatDate(credito.fecha_inicio || credito.created_at)],
      ["Fecha fin:", credito.fecha_fin ? formatDate(credito.fecha_fin) : "No especificada"],
    ];

    detalles.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 85, y);
      y += 7;
    });

    y += 5;

    // HISTORIAL DE PAGOS
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("HISTORIAL DE PAGOS", 20, y);
    y += 8;

    if (listaPagos.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.text("No se han registrado pagos", 20, y);
      y += 10;
    } else {
      // Encabezados de tabla
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("#", 20, y);
      doc.text("Fecha", 30, y);
      doc.text("Monto", 90, y);
      doc.text("Metodo", 135, y);
      y += 2;
      doc.setDrawColor(200);
      doc.line(20, y, 190, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      listaPagos.forEach((pago, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
          // Re-dibujar encabezados
          doc.setFont("helvetica", "bold");
          doc.text("#", 20, y);
          doc.text("Fecha", 30, y);
          doc.text("Monto", 90, y);
          doc.text("Metodo", 135, y);
          y += 2;
          doc.line(20, y, 190, y);
          y += 5;
          doc.setFont("helvetica", "normal");
        }

        doc.text(`${index + 1}`, 20, y);
        doc.text(formatDate(pago.fecha_pago || pago.created_at), 30, y);
        doc.text(formatCurrency(Number(pago.monto || 0)), 90, y);
        doc.text(NOMBRES_METODO[pago.metodo_pago] || pago.metodo_pago || "", 135, y);
        y += 6;
      });

      y += 3;
      doc.setDrawColor(200);
      doc.line(20, y, 190, y);
      y += 8;
    }

    // RESUMEN FINANCIERO
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESUMEN", 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total del credito:`, 20, y);
    doc.text(formatCurrency(monto), 90, y);
    y += 7;

    doc.text(`Total pagado:`, 20, y);
    doc.setTextColor(16, 185, 129);
    doc.text(formatCurrency(totalPagado), 90, y);
    doc.setTextColor(0, 0, 0);
    y += 7;

    const saldoPendiente = Math.max(0, monto - totalPagado);
    doc.setFont("helvetica", "bold");
    doc.text(`Saldo pendiente:`, 20, y);
    if (saldoPendiente > 0) {
      doc.setTextColor(239, 68, 68);
      doc.text(formatCurrency(saldoPendiente), 90, y);
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setTextColor(16, 185, 129);
      doc.text("LIQUIDADO", 90, y);
      doc.setTextColor(0, 0, 0);
    }
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.text(`Pagos realizados: ${listaPagos.length}`, 20, y);
    y += 15;

    // PIE DE PAGINA
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Este documento es un comprobante generado por el sistema CREDIPHONE.",
      105,
      280,
      { align: "center" }
    );

    // Generar buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Credito-${folio}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error al generar PDF de credito:", error);
    return NextResponse.json(
      { success: false, message: "Error al generar PDF" },
      { status: 500 }
    );
  }
}
