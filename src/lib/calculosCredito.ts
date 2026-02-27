// Utilidades para cálculos financieros de créditos

export interface CalculoCreditoParams {
  montoOriginal: number;
  enganchePorcentaje: number;
  plazo: number; // en meses
  tasaInteresBase: number;
  frecuenciaPago: "semanal" | "quincenal" | "mensual";
}

export interface ResultadoCalculo {
  montoEnganche: number;
  montoFinanciar: number;
  tasaInteresAjustada: number;
  montoInteres: number;
  montoTotalPagar: number;
  montoPorPago: number;
  numeroPagos: number;
  cat: number; // Costo Anual Total
}

export interface PagoAmortizacion {
  numero: number;
  fecha: Date;
  montoPago: number;
  capital: number;
  interes: number;
  saldoPendiente: number;
}

/**
 * Calcula la tasa de interés ajustada según el plazo
 * Plazos cortos tienen descuento (bonificación por pago rápido)
 * Plazos largos tienen incremento
 */
export function calcularTasaAjustada(tasaBase: number, plazoMeses: number): number {
  let ajuste = 0;

  if (plazoMeses <= 3) {
    ajuste = -5; // Bonificación de 5% por pago rápido (3 meses o menos)
  } else if (plazoMeses >= 4 && plazoMeses <= 6) {
    ajuste = 0; // Sin ajuste (4-6 meses)
  } else if (plazoMeses >= 7 && plazoMeses <= 12) {
    ajuste = 5; // +5% (7-12 meses)
  } else if (plazoMeses >= 13 && plazoMeses <= 18) {
    ajuste = 10; // +10% (13-18 meses)
  } else if (plazoMeses >= 19) {
    ajuste = 15; // +15% (19+ meses)
  }

  // Mínimo 15%, Máximo 60%
  return Math.max(15, Math.min(tasaBase + ajuste, 60));
}

/**
 * Calcula todas las variables del crédito
 */
export function calcularCredito(params: CalculoCreditoParams): ResultadoCalculo {
  const {
    montoOriginal,
    enganchePorcentaje,
    plazo,
    tasaInteresBase,
    frecuenciaPago,
  } = params;

  // 1. Calcular enganche
  const montoEnganche = (montoOriginal * enganchePorcentaje) / 100;
  const montoFinanciar = montoOriginal - montoEnganche;

  // 2. Ajustar tasa según plazo
  const tasaInteresAjustada = calcularTasaAjustada(tasaInteresBase, plazo);

  // 3. Calcular interés total
  const montoInteres = (montoFinanciar * tasaInteresAjustada) / 100;
  const montoTotalPagar = montoFinanciar + montoInteres;

  // 4. Calcular número de pagos según frecuencia
  let numeroPagos: number;
  switch (frecuenciaPago) {
    case "semanal":
      numeroPagos = plazo * 4; // 4 semanas por mes
      break;
    case "quincenal":
      numeroPagos = plazo * 2; // 2 quincenas por mes
      break;
    case "mensual":
      numeroPagos = plazo; // 1 pago por mes
      break;
  }

  // 5. Calcular monto por pago
  const montoPorPago = montoTotalPagar / numeroPagos;

  // 6. Calcular CAT (Costo Anual Total)
  const cat = calcularCAT(montoFinanciar, tasaInteresAjustada, plazo);

  return {
    montoEnganche,
    montoFinanciar,
    tasaInteresAjustada,
    montoInteres,
    montoTotalPagar,
    montoPorPago,
    numeroPagos,
    cat,
  };
}

/**
 * Calcula el CAT (Costo Anual Total)
 * Fórmula mejorada que considera el total a pagar
 */
export function calcularCAT(
  monto: number,
  tasaInteres: number,
  plazoMeses: number,
  comisiones: number = 0
): number {
  // Calcular interés total
  const interesTotal = (monto * tasaInteres) / 100;
  const montoTotalPagar = monto + interesTotal + comisiones;

  // Costo total del crédito
  const costoTotal = montoTotalPagar - monto;

  // CAT anualizado
  // CAT = (Costo Total / Monto Original) * (365 / Días del plazo) * 100
  const plazoDias = plazoMeses * 30.42; // Días promedio por mes
  const cat = (costoTotal / monto) * (365 / plazoDias) * 100;

  return Math.round(cat * 100) / 100; // Redondear a 2 decimales
}

/**
 * Genera la tabla de amortización completa
 */
export function generarTablaAmortizacion(
  params: CalculoCreditoParams,
  fechaInicio: Date
): PagoAmortizacion[] {
  const resultado = calcularCredito(params);
  const tabla: PagoAmortizacion[] = [];

  const capitalPorPago = resultado.montoFinanciar / resultado.numeroPagos;
  const interesPorPago = resultado.montoInteres / resultado.numeroPagos;

  // CORRECCIÓN: Saldo pendiente debe incluir capital + interés
  let saldoPendiente = resultado.montoTotalPagar; // Total a pagar (capital + interés)
  let fechaPago = new Date(fechaInicio);

  // Calcular incremento de días según frecuencia
  let diasIncremento: number;
  switch (params.frecuenciaPago) {
    case "semanal":
      diasIncremento = 7;
      break;
    case "quincenal":
      diasIncremento = 15;
      break;
    case "mensual":
      diasIncremento = 30;
      break;
  }

  for (let i = 1; i <= resultado.numeroPagos; i++) {
    // Calcular fecha del pago
    if (i > 1) {
      fechaPago = new Date(fechaPago);
      fechaPago.setDate(fechaPago.getDate() + diasIncremento);
    }

    // Saldo antes del pago
    const saldoActual = saldoPendiente;

    // Aplicar pago completo (capital + interés)
    saldoPendiente -= resultado.montoPorPago;

    // Último pago ajusta cualquier diferencia por redondeo
    if (i === resultado.numeroPagos) {
      saldoPendiente = 0;
    }

    tabla.push({
      numero: i,
      fecha: new Date(fechaPago),
      montoPago: resultado.montoPorPago,
      capital: capitalPorPago,
      interes: interesPorPago,
      saldoPendiente: Math.max(0, saldoPendiente),
    });
  }

  return tabla;
}

/**
 * Formatea un número como moneda MXN
 */
export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(monto);
}

/**
 * Formatea una fecha en formato corto
 */
export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(fecha);
}

/**
 * Obtiene las opciones de tasas de interés disponibles
 * Rango: 20% a 60% en incrementos de 5%
 */
export function obtenerOpcionesTasas(): number[] {
  const tasas: number[] = [];
  for (let tasa = 20; tasa <= 60; tasa += 5) {
    tasas.push(tasa);
  }
  return tasas;
}

/**
 * Obtiene las opciones de enganche según el perfil del cliente
 */
export function obtenerOpcionesEnganche(
  esClienteNuevo: boolean = true,
  tieneMora: boolean = false
): { valor: number; etiqueta: string }[] {
  const opciones = [];

  if (tieneMora) {
    // Cliente con mora: enganche más alto
    opciones.push(
      { valor: 30, etiqueta: "30% - Mínimo por mora" },
      { valor: 35, etiqueta: "35%" },
      { valor: 40, etiqueta: "40%" },
      { valor: 50, etiqueta: "50% - Recomendado" }
    );
  } else if (esClienteNuevo) {
    // Cliente nuevo: enganche estándar
    opciones.push(
      { valor: 10, etiqueta: "10% - Mínimo" },
      { valor: 15, etiqueta: "15%" },
      { valor: 20, etiqueta: "20% - Recomendado" },
      { valor: 25, etiqueta: "25%" },
      { valor: 30, etiqueta: "30%" }
    );
  } else {
    // Cliente recurrente: enganche más flexible
    opciones.push(
      { valor: 5, etiqueta: "5% - Cliente frecuente" },
      { valor: 10, etiqueta: "10%" },
      { valor: 15, etiqueta: "15%" },
      { valor: 20, etiqueta: "20%" }
    );
  }

  return opciones;
}
