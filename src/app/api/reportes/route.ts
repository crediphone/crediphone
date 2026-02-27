import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fecha de hace 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split("T")[0];

    // Ejecutar consultas en paralelo
    const [
      creditosRes,
      pagosRes,
      clientesRes,
    ] = await Promise.all([
      supabase.from("creditos").select("id, monto, estado, created_at, cliente_id, plazo, tasa_interes"),
      supabase.from("pagos").select("id, monto, fecha_pago, metodo_pago, created_at"),
      supabase.from("clientes").select("id, nombre, apellido"),
    ]);

    const creditos = creditosRes.data || [];
    const pagos = pagosRes.data || [];
    const clientes = clientesRes.data || [];

    // --- Creditos por mes (ultimos 6 meses) ---
    const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
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

    // --- Pagos por mes (ultimos 6 meses) ---
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

    // --- Distribucion de creditos por estado ---
    const estadosCreditos: Record<string, number> = {};
    creditos.forEach((c) => {
      const estado = c.estado || "desconocido";
      estadosCreditos[estado] = (estadosCreditos[estado] || 0) + 1;
    });

    // --- Distribucion de metodos de pago ---
    const metodosPago: Record<string, number> = {};
    pagos.forEach((p) => {
      const metodo = p.metodo_pago || "otro";
      metodosPago[metodo] = (metodosPago[metodo] || 0) + 1;
    });

    // --- KPIs del mes actual ---
    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();

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
      ? ((montoTotalCreditos - montoTotalActivos) / montoTotalCreditos * 100)
      : 0;

    // --- Top 5 clientes por monto de credito activo ---
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

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          creditosNuevosMes: creditosMesActual.length,
          montoCreditosMes: creditosMesActual.reduce((sum, c) => sum + Number(c.monto || 0), 0),
          cobranzaMes: pagosMesActual.reduce((sum, p) => sum + Number(p.monto || 0), 0),
          pagosCountMes: pagosMesActual.length,
          creditosActivos: creditosActivos.length,
          tasaRecuperacion: Math.round(tasaRecuperacion * 10) / 10,
          totalCreditos: creditos.length,
          totalPagos: pagos.length,
        },
        creditosPorMes,
        pagosPorMes,
        estadosCreditos,
        metodosPago,
        topClientes,
      },
    });
  } catch (error) {
    console.error("Error en /api/reportes:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener reportes" },
      { status: 500 }
    );
  }
}
