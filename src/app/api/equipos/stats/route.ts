import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/equipos/stats?periodo=mes|3m|6m|ano
 *
 * Devuelve KPIs de ventas de equipos celulares:
 *  - Ventas de contado (ventas_items JOIN productos tipo equipo_*)
 *  - Créditos (todos los créditos del período — en CREDIPHONE son para teléfonos)
 *  - Modelos más vendidos (contado)
 *  - Tendencia mensual (últimos N meses)
 */
export async function GET(request: Request) {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();
    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") ?? "mes";

    const filterDistribuidorId =
      role === "super_admin" ? undefined : (distribuidorId ?? undefined);

    // ── Calcular rangos de fecha ──────────────────────────────────────────────
    const hoy = new Date();
    let periodoInicio: Date;

    if (periodo === "3m") {
      periodoInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
    } else if (periodo === "6m") {
      periodoInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
    } else if (periodo === "ano") {
      periodoInicio = new Date(hoy.getFullYear(), 0, 1);
    } else {
      // mes actual por defecto
      periodoInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    }
    const periodoFin = hoy;

    // ── Meses para tendencia ──────────────────────────────────────────────────
    // Siempre mostramos últimos 6 meses para la tendencia
    const tendenciaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);

    const supabase = createAdminClient();

    // ── 1. Ventas de contado de equipos ───────────────────────────────────────
    let ventasQuery = supabase
      .from("ventas_items")
      .select(
        `id, producto_id, producto_nombre, producto_marca, producto_modelo,
         cantidad, precio_unitario, subtotal,
         ventas!inner(id, descuento, total, fecha_venta, estado, distribuidor_id),
         productos!left(tipo, imei, color, almacenamiento, ram)`
      )
      .eq("ventas.estado", "completada")
      .gte("ventas.fecha_venta", periodoInicio.toISOString())
      .lte("ventas.fecha_venta", periodoFin.toISOString());

    if (filterDistribuidorId) {
      ventasQuery = ventasQuery.eq("ventas.distribuidor_id", filterDistribuidorId);
    }

    const { data: ventasItems } = await ventasQuery;

    // Filtrar solo equipos
    const itemsEquipos = (ventasItems ?? []).filter((item: any) => {
      const tipo = item.productos?.tipo;
      return tipo === "equipo_nuevo" || tipo === "equipo_usado";
    });

    // ── 2. Créditos del período ───────────────────────────────────────────────
    let creditosQuery = supabase
      .from("creditos")
      .select(
        `id, monto, monto_original, enganche, enganche_porcentaje,
         plazo, frecuencia_pago, monto_pago, pago_quincenal,
         estado, created_at, distribuidor_id`
      )
      .gte("created_at", periodoInicio.toISOString())
      .lte("created_at", periodoFin.toISOString());

    if (filterDistribuidorId) {
      creditosQuery = creditosQuery.eq("distribuidor_id", filterDistribuidorId);
    }

    const { data: creditos } = await creditosQuery;
    const creditosData = creditos ?? [];

    // ── 3. Tendencia: ventas contado últimos 6 meses ──────────────────────────
    let tendenciaVentasQuery = supabase
      .from("ventas_items")
      .select(
        `producto_id, cantidad, subtotal,
         ventas!inner(fecha_venta, estado, distribuidor_id, descuento),
         productos!left(tipo)`
      )
      .eq("ventas.estado", "completada")
      .gte("ventas.fecha_venta", tendenciaInicio.toISOString());

    if (filterDistribuidorId) {
      tendenciaVentasQuery = tendenciaVentasQuery.eq(
        "ventas.distribuidor_id",
        filterDistribuidorId
      );
    }

    const { data: tendenciaVentasItems } = await tendenciaVentasQuery;

    const itemsTendenciaEquipos = (tendenciaVentasItems ?? []).filter((item: any) => {
      const tipo = item.productos?.tipo;
      return tipo === "equipo_nuevo" || tipo === "equipo_usado";
    });

    // Créditos tendencia últimos 6 meses
    let tendenciaCreditosQuery = supabase
      .from("creditos")
      .select(`id, monto, enganche, created_at, distribuidor_id`)
      .gte("created_at", tendenciaInicio.toISOString());

    if (filterDistribuidorId) {
      tendenciaCreditosQuery = tendenciaCreditosQuery.eq(
        "distribuidor_id",
        filterDistribuidorId
      );
    }

    const { data: tendenciaCreditos } = await tendenciaCreditosQuery;

    // ── Procesar KPIs del período ─────────────────────────────────────────────

    // Contado
    const totalContado = itemsEquipos.reduce((s: number, i: any) => s + i.cantidad, 0);
    const ingresoContado = itemsEquipos.reduce(
      (s: number, i: any) => s + parseFloat(i.subtotal),
      0
    );

    // Descuentos (nivel venta — suma los descuentos de ventas que tienen equipos)
    const ventasConEquipo = new Map<string, any>();
    itemsEquipos.forEach((item: any) => {
      const ventaId = item.ventas?.id ?? item.venta_id;
      if (ventaId && !ventasConEquipo.has(ventaId)) {
        ventasConEquipo.set(ventaId, item.ventas);
      }
    });
    const ventasConDescuento = [...ventasConEquipo.values()].filter(
      (v) => v && parseFloat(v.descuento ?? 0) > 0
    );
    const montoDescuentos = ventasConDescuento.reduce(
      (s, v) => s + parseFloat(v.descuento ?? 0),
      0
    );

    // Crédito
    const totalCredito = creditosData.length;
    const ingresoEnganche = creditosData.reduce(
      (s, c: any) => s + parseFloat(c.enganche ?? 0),
      0
    );
    const enganhePromedio =
      creditosData.length > 0 ? ingresoEnganche / creditosData.length : 0;
    const montoPagoPromedio =
      creditosData.length > 0
        ? creditosData.reduce(
            (s, c: any) =>
              s + parseFloat(c.monto_pago ?? c.pago_quincenal ?? 0),
            0
          ) / creditosData.length
        : 0;
    const plazoPromedio =
      creditosData.length > 0
        ? creditosData.reduce((s, c: any) => s + (c.plazo ?? 0), 0) /
          creditosData.length
        : 0;

    const porFrecuencia = {
      semanal: creditosData.filter((c: any) => c.frecuencia_pago === "semanal").length,
      quincenal: creditosData.filter((c: any) => c.frecuencia_pago === "quincenal").length,
      mensual: creditosData.filter((c: any) => c.frecuencia_pago === "mensual").length,
    };

    // ── Modelos más vendidos (contado) ────────────────────────────────────────
    const modelosMap = new Map<
      string,
      {
        marca: string;
        modelo: string;
        unidades: number;
        ingresoTotal: number;
        ventasConDescuento: number;
      }
    >();

    itemsEquipos.forEach((item: any) => {
      const marca = item.producto_marca ?? "Sin marca";
      const modelo = item.producto_modelo ?? item.producto_nombre ?? "Sin modelo";
      const key = `${marca}||${modelo}`;
      const existing = modelosMap.get(key);
      const tieneDescuento =
        parseFloat(item.ventas?.descuento ?? 0) > 0 ? 1 : 0;
      if (existing) {
        existing.unidades += item.cantidad;
        existing.ingresoTotal += parseFloat(item.subtotal);
        existing.ventasConDescuento += tieneDescuento;
      } else {
        modelosMap.set(key, {
          marca,
          modelo,
          unidades: item.cantidad,
          ingresoTotal: parseFloat(item.subtotal),
          ventasConDescuento: tieneDescuento,
        });
      }
    });

    const modelosMasVendidos = Array.from(modelosMap.values())
      .map((m) => ({
        ...m,
        precioPromedio: m.unidades > 0 ? m.ingresoTotal / m.unidades : 0,
      }))
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 25);

    // ── Tendencia últimos 6 meses ─────────────────────────────────────────────
    const meses: { label: string; inicio: Date; fin: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const fin = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0, 23, 59, 59);
      meses.push({
        label: inicio.toLocaleDateString("es-MX", {
          month: "short",
          year: "2-digit",
        }),
        inicio,
        fin,
      });
    }

    const tendencia = meses.map(({ label, inicio, fin }) => {
      const contadoMes = itemsTendenciaEquipos
        .filter((item: any) => {
          const fecha = new Date(item.ventas?.fecha_venta);
          return fecha >= inicio && fecha <= fin;
        })
        .reduce((s: number, i: any) => s + i.cantidad, 0);

      const ingresosMes = itemsTendenciaEquipos
        .filter((item: any) => {
          const fecha = new Date(item.ventas?.fecha_venta);
          return fecha >= inicio && fecha <= fin;
        })
        .reduce((s: number, i: any) => s + parseFloat(i.subtotal), 0);

      const creditoMes = (tendenciaCreditos ?? []).filter((c: any) => {
        const fecha = new Date(c.created_at);
        return fecha >= inicio && fecha <= fin;
      }).length;

      const enganchesMes = (tendenciaCreditos ?? [])
        .filter((c: any) => {
          const fecha = new Date(c.created_at);
          return fecha >= inicio && fecha <= fin;
        })
        .reduce((s: number, c: any) => s + parseFloat(c.enganche ?? 0), 0);

      return {
        mes: label,
        contado: contadoMes,
        credito: creditoMes,
        ingresos: ingresosMes,
        enganches: enganchesMes,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        periodo: {
          inicio: periodoInicio.toISOString(),
          fin: periodoFin.toISOString(),
          label: periodo,
        },
        resumen: {
          totalContado,
          totalCredito,
          totalEquipos: totalContado + totalCredito,
          ingresoContado,
          ingresoEnganche,
          descuentosAplicados: ventasConDescuento.length,
          montoDescuentos,
        },
        modelosMasVendidos,
        estadisticasCredito: {
          totalCreditos: totalCredito,
          enganhePromedio,
          montoPagoPromedio,
          plazoPromedio,
          porFrecuencia,
          ingresoEngancheTotal: ingresoEnganche,
        },
        tendencia,
      },
    });
  } catch (error) {
    console.error("[/api/equipos/stats] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener estadísticas de equipos" },
      { status: 500 }
    );
  }
}
