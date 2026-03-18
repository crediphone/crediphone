import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Buckets de antigüedad para el reporte de cartera.
 * Cada bucket cubre un rango de días de mora.
 */
const AGING_BUCKETS = [
  { key: "corriente",  label: "Al corriente",  min: 0,   max: 0    },
  { key: "b1_30",      label: "1 – 30 días",   min: 1,   max: 30   },
  { key: "b31_60",     label: "31 – 60 días",  min: 31,  max: 60   },
  { key: "b61_90",     label: "61 – 90 días",  min: 61,  max: 90   },
  { key: "b91_120",    label: "91 – 120 días", min: 91,  max: 120  },
  { key: "b120plus",   label: "+ 120 días",    min: 121, max: Infinity },
] as const;

export type AgingBucketKey = (typeof AGING_BUCKETS)[number]["key"];

export interface AgingBucket {
  key:         AgingBucketKey;
  label:       string;
  count:       number;        // número de créditos en el bucket
  saldoTotal:  number;        // suma de saldo pendiente
  moraTotal:   number;        // suma de mora acumulada
  porcentaje:  number;        // % del total de saldo activo
}

export interface AgingReport {
  fechaCorte:         string;
  totalCreditos:      number;   // activos + vencidos
  totalCartera:       number;   // saldo total (todos los activos)
  totalEnMora:        number;   // saldo en mora (dias_mora > 0)
  tasaMoraConteo:     number;   // (créditos con mora / total) × 100
  tasaMoraMonto:      number;   // (saldo en mora / saldo total) × 100
  moraAcumulada:      number;   // suma de monto_mora en toda la cartera
  buckets:            AgingBucket[];
}

/**
 * GET /api/creditos/aging
 * Reporte de antigüedad de saldos + tasa de mora real.
 * Acceso: admin, cobrador, super_admin
 */
export async function GET() {
  try {
    const { userId, role, distribuidorId } = await getAuthContext();

    if (!userId) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }
    if (!role || !["admin", "cobrador", "vendedor", "super_admin"].includes(role)) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const filterDistribuidor = role === "super_admin" ? undefined : (distribuidorId ?? undefined);

    // 1. Traer TODOS los créditos activos/vencidos (no solo los que tienen mora)
    let query = supabase
      .from("creditos")
      .select(`
        id, monto, dias_mora, monto_mora, estado
      `)
      .in("estado", ["activo", "vencido"]);

    if (filterDistribuidor) {
      query = query.eq("distribuidor_id", filterDistribuidor);
    }

    const { data: creditos, error } = await query;
    if (error) throw new Error(error.message);

    const rows = creditos || [];

    // 2. Traer pagos para calcular saldo pendiente por crédito
    const ids = rows.map((c: Record<string, unknown>) => c.id as string);
    let pagosMap: Record<string, number> = {};

    if (ids.length > 0) {
      const { data: pagosData } = await supabase
        .from("pagos")
        .select("credito_id, monto")
        .in("credito_id", ids)
        .not("estado", "eq", "cancelado");

      for (const p of pagosData || []) {
        pagosMap[p.credito_id] = (pagosMap[p.credito_id] || 0) + Number(p.monto);
      }
    }

    // 3. Calcular saldo pendiente por crédito y asignar bucket
    const creditosConSaldo = rows.map((c: Record<string, unknown>) => {
      const monto       = Number(c.monto)      || 0;
      const diasMora    = Number(c.dias_mora)  || 0;
      const montoMora   = Number(c.monto_mora) || 0;
      const totalPagado = pagosMap[c.id as string] || 0;
      const saldo       = Math.max(0, monto - totalPagado);

      // Determinar bucket
      let bucket: AgingBucketKey = "corriente";
      for (const b of AGING_BUCKETS) {
        const max = b.max === Infinity ? Number.MAX_SAFE_INTEGER : b.max;
        if (diasMora >= b.min && diasMora <= max) {
          bucket = b.key;
          break;
        }
      }

      return { saldo, diasMora, montoMora, bucket };
    });

    // 4. Agregar por bucket
    const totalCartera = creditosConSaldo.reduce((s, c) => s + c.saldo, 0);

    const bucketMap = new Map<AgingBucketKey, AgingBucket>();
    for (const def of AGING_BUCKETS) {
      bucketMap.set(def.key, {
        key:        def.key,
        label:      def.label,
        count:      0,
        saldoTotal: 0,
        moraTotal:  0,
        porcentaje: 0,
      });
    }

    for (const c of creditosConSaldo) {
      const b = bucketMap.get(c.bucket)!;
      b.count++;
      b.saldoTotal += c.saldo;
      b.moraTotal  += c.montoMora;
    }

    // Calcular porcentajes
    for (const b of bucketMap.values()) {
      b.porcentaje = totalCartera > 0 ? (b.saldoTotal / totalCartera) * 100 : 0;
    }

    // 5. Métricas globales
    const totalCreditos     = creditosConSaldo.length;
    const enMora            = creditosConSaldo.filter((c) => c.diasMora > 0);
    const totalEnMora       = enMora.reduce((s, c) => s + c.saldo, 0);
    const moraAcumulada     = creditosConSaldo.reduce((s, c) => s + c.montoMora, 0);
    const tasaMoraConteo    = totalCreditos > 0 ? (enMora.length / totalCreditos) * 100 : 0;
    const tasaMoraMonto     = totalCartera  > 0 ? (totalEnMora  / totalCartera)  * 100 : 0;

    const report: AgingReport = {
      fechaCorte:     new Date().toISOString(),
      totalCreditos,
      totalCartera,
      totalEnMora,
      tasaMoraConteo: Math.round(tasaMoraConteo * 10) / 10,
      tasaMoraMonto:  Math.round(tasaMoraMonto  * 10) / 10,
      moraAcumulada,
      buckets:        Array.from(bucketMap.values()),
    };

    return NextResponse.json({ success: true, data: report });

  } catch (error) {
    console.error("Error en GET /api/creditos/aging:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al generar aging report" },
      { status: 500 }
    );
  }
}
