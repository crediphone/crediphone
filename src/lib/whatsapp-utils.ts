/**
 * Utilidades para integración con WhatsApp
 * Usando WhatsApp Web (wa.me) - Sin costos de API
 */

/**
 * Datos para generar mensaje de recordatorio
 */
export interface MensajeRecordatorioData {
  nombreCliente: string;
  folioCredito: string;
  fechaVencimiento: string;
  saldoPendiente: number;
  diasMora?: number;
  montoPago?: number;
}

/**
 * Formatea cantidad en pesos mexicanos
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

/**
 * Formatea fecha en formato legible
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Genera mensaje de recordatorio personalizado
 */
export function generarMensajeRecordatorio(
  data: MensajeRecordatorioData
): string {
  const {
    nombreCliente,
    folioCredito,
    fechaVencimiento,
    saldoPendiente,
    diasMora,
    montoPago,
  } = data;

  const saldoFormateado = formatCurrency(saldoPendiente);
  const fechaFormateada = formatDate(fechaVencimiento);

  // Mensaje para créditos con mora
  if (diasMora && diasMora > 0) {
    const esUrgente = diasMora > 30;
    const emoji = esUrgente ? "🚨" : "⚠️";

    return `${emoji} *RECORDATORIO DE PAGO - CREDIPHONE*

Hola *${nombreCliente}*,

Te contactamos para recordarte que tu crédito tiene *${diasMora} día(s) de mora*.

📋 *Folio:* ${folioCredito}
💰 *Saldo pendiente:* ${saldoFormateado}
📅 *Fecha de vencimiento:* ${fechaFormateada}
${montoPago ? `💵 *Pago quincenal:* ${formatCurrency(montoPago)}` : ""}

${
  esUrgente
    ? "⏰ *Es urgente regularizar tu situación*. Por favor, comunícate con nosotros lo antes posible."
    : "Te pedimos que te pongas al corriente con tus pagos. Estamos aquí para ayudarte."
}

*¿Necesitas ayuda?* Contáctanos y encontraremos una solución juntos. 🤝

_Gracias por tu atención_
📱 *CREDIPHONE*`;
  }

  // Mensaje para créditos próximos a vencer
  const diasHastaVencimiento = Math.ceil(
    (new Date(fechaVencimiento).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (diasHastaVencimiento <= 0) {
    return `⏰ *RECORDATORIO DE PAGO - CREDIPHONE*

Hola *${nombreCliente}*,

Tu crédito *vence hoy*. Te pedimos realizar tu pago lo antes posible.

📋 *Folio:* ${folioCredito}
💰 *Monto a pagar:* ${saldoFormateado}
📅 *Fecha de vencimiento:* ${fechaFormateada}

¡Gracias por tu puntualidad! 😊

📱 *CREDIPHONE*`;
  }

  return `👋 *RECORDATORIO DE PAGO - CREDIPHONE*

Hola *${nombreCliente}*,

Te recordamos que tu crédito vence en *${diasHastaVencimiento} día(s)*.

📋 *Folio:* ${folioCredito}
💰 *Saldo pendiente:* ${saldoFormateado}
📅 *Fecha de vencimiento:* ${fechaFormateada}
${montoPago ? `💵 *Pago quincenal:* ${formatCurrency(montoPago)}` : ""}

¡Gracias por mantener tus pagos al día! 😊

_Si ya realizaste tu pago, ignora este mensaje_
📱 *CREDIPHONE*`;
}

/**
 * Genera mensaje de confirmación de pago
 */
export function generarMensajeConfirmacionPago(data: {
  nombreCliente: string;
  folioCredito: string;
  montoPagado: number;
  saldoRestante: number;
}): string {
  const { nombreCliente, folioCredito, montoPagado, saldoRestante } = data;

  return `✅ *PAGO RECIBIDO - CREDIPHONE*

Hola *${nombreCliente}*,

¡Hemos recibido tu pago! Gracias por tu puntualidad.

📋 *Folio:* ${folioCredito}
💵 *Monto recibido:* ${formatCurrency(montoPagado)}
💰 *Saldo restante:* ${formatCurrency(saldoRestante)}

${
  saldoRestante === 0
    ? "🎉 *¡Felicidades!* Has liquidado completamente tu crédito."
    : "Continúa con tus pagos puntuales para liquidar tu crédito."
}

¡Gracias por tu confianza! 🤝
📱 *CREDIPHONE*`;
}

/**
 * Limpia número telefónico (solo dígitos)
 */
function limpiarTelefono(telefono: string): string {
  return telefono.replace(/\D/g, "");
}

/**
 * Agrega código de país (México = 52) si no lo tiene
 */
function agregarCodigoPais(telefono: string): string {
  const telefonoLimpio = limpiarTelefono(telefono);

  // Si ya tiene código de país, retornar tal cual
  if (telefonoLimpio.startsWith("52") && telefonoLimpio.length > 10) {
    return telefonoLimpio;
  }

  // Si es número de 10 dígitos (formato México), agregar código 52
  if (telefonoLimpio.length === 10) {
    return `52${telefonoLimpio}`;
  }

  // Si tiene 11-12 dígitos pero no empieza con 52, agregar 52
  if (telefonoLimpio.length >= 11 && telefonoLimpio.length <= 12) {
    return `52${telefonoLimpio}`;
  }

  // Por defecto, agregar 52
  return `52${telefonoLimpio}`;
}

/**
 * Genera link de WhatsApp Web con mensaje pre-llenado
 * Usando API wa.me (gratis, sin necesidad de WhatsApp Business)
 */
export function generarLinkWhatsApp(
  telefono: string,
  mensaje: string
): string {
  const telefonoCompleto = agregarCodigoPais(telefono);
  const mensajeCodificado = encodeURIComponent(mensaje);

  return `https://wa.me/${telefonoCompleto}?text=${mensajeCodificado}`;
}

/**
 * Abre WhatsApp en nueva pestaña con mensaje pre-llenado
 */
export function abrirWhatsApp(telefono: string, mensaje: string): void {
  const link = generarLinkWhatsApp(telefono, mensaje);
  window.open(link, "_blank", "noopener,noreferrer");
}

/**
 * Valida si un número de teléfono es válido (México)
 */
export function validarTelefono(telefono: string): boolean {
  const telefonoLimpio = limpiarTelefono(telefono);

  // Teléfono mexicano: 10 dígitos
  // Con código de país: 12 dígitos (52 + 10)
  return telefonoLimpio.length === 10 || telefonoLimpio.length === 12;
}

/**
 * Formatea número telefónico para mostrar
 * Ejemplo: 5512345678 -> (55) 1234-5678
 */
export function formatearTelefono(telefono: string): string {
  const telefonoLimpio = limpiarTelefono(telefono);

  // Si tiene código de país (52), removerlo para formato visual
  const numeroBase =
    telefonoLimpio.startsWith("52") && telefonoLimpio.length === 12
      ? telefonoLimpio.slice(2)
      : telefonoLimpio;

  // Formato: (55) 1234-5678
  if (numeroBase.length === 10) {
    return `(${numeroBase.slice(0, 2)}) ${numeroBase.slice(2, 6)}-${numeroBase.slice(6)}`;
  }

  // Si no es formato esperado, retornar tal cual
  return telefono;
}
