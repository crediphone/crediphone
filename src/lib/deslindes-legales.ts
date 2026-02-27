import {
  CondicionesFuncionamiento,
  EstadoFisicoDispositivo,
  EstadoFisico,
} from "@/types";

// =====================================================
// TEMPLATES DE DESLINDES POR TIPO DE SERVICIO
// =====================================================

const DESLINDES_POR_SERVICIO = {
  // Problemas de pantalla/display
  pantalla: `REPARACIÓN DE PANTALLA: El cliente autoriza el reemplazo de pantalla. CREDIPHONE no se hace responsable por daños internos no visibles que se descubran durante el proceso. La garantía cubre únicamente la pantalla instalada, no componentes adicionales.`,

  // Problemas de batería
  bateria: `REEMPLAZO DE BATERÍA: La batería es un componente de desgaste natural. La garantía cubre defectos de fabricación de la batería nueva, NO la duración de carga (que depende del uso del cliente).`,

  // Batería hinchada
  bateria_hinchada: `BATERÍA HINCHADA: El dispositivo presenta batería hinchada, lo cual es un riesgo de seguridad. CREDIPHONE no se hace responsable por daños causados por el cliente al continuar usando el dispositivo antes de la reparación. La batería hinchada puede haber dañado otros componentes internos.`,

  // Problemas de líquidos
  liquidos: `DAÑO POR LÍQUIDO: El dispositivo presenta signos de exposición a líquidos. Los daños por líquidos pueden manifestarse progresivamente y afectar componentes adicionales. La garantía NO cubre daños derivados de oxidación o corrosión. El presupuesto inicial puede incrementarse si se descubren daños adicionales durante la reparación.`,

  // Problema de no enciende
  no_enciende: `DISPOSITIVO SIN ENCENDER: Debido a que el equipo no enciende, CREDIPHONE no puede verificar el estado completo del software, aplicaciones, o memoria. El presupuesto cubre únicamente el problema reportado. Cualquier problema adicional que se descubra al reparar requerirá autorización adicional.`,

  // Problema de software
  software: `SERVICIO DE SOFTWARE: CREDIPHONE realizará respaldo de información siempre que sea posible, sin embargo NO se hace responsable por pérdida de datos durante formateos o actualizaciones. El cliente debe realizar respaldo previo.`,

  // Físico/golpes
  fisico: `DAÑO FÍSICO: El dispositivo presenta daño físico considerable. Pueden existir daños internos en placa base, sensores o componentes no visibles. El presupuesto inicial cubre únicamente los daños reportados visualmente.`,

  // Cámara
  camara: `REPARACIÓN DE CÁMARA: La reparación de cámara puede afectar la calidad de imagen si el problema está relacionado con software o calibración. La garantía cubre el funcionamiento de la cámara, no la calidad de imagen original de fábrica.`,

  // Puerto de carga
  carga: `REPARACIÓN DE PUERTO DE CARGA: El cliente debe evitar el uso de cargadores no originales. La garantía NO cubre daños causados por uso de cargadores incompatibles o de mala calidad.`,

  // Audio (micrófono/altavoz)
  audio: `REPARACIÓN DE AUDIO: Los problemas de audio pueden estar relacionados con hardware o software. La reparación cubre el componente físico; si el problema persiste por software, requerirá servicio adicional.`,

  // Conectividad (WiFi/Bluetooth)
  conectividad: `REPARACIÓN DE CONECTIVIDAD: Los problemas de WiFi/Bluetooth pueden estar relacionados con antenas, módulos o software. La garantía cubre el componente reemplazado, pero la calidad de señal puede variar según la ubicación y router.`,

  // Táctil
  tactil: `REPARACIÓN DE PANTALLA TÁCTIL: El funcionamiento del táctil está vinculado al estado del digitalizador y puede verse afectado por golpes previos. La garantía cubre el componente instalado, no daños por mal uso posterior.`,

  // Botones
  botones: `REPARACIÓN DE BOTONES: Los botones físicos son componentes de uso frecuente. La garantía cubre defectos de fabricación, no desgaste por uso normal o presión excesiva.`,

  // Sensor de huella
  huella: `REPARACIÓN DE SENSOR DE HUELLA: El sensor de huella puede requerir recalibración o registro de huellas nuevamente después de la reparación. La garantía cubre el funcionamiento del sensor, no la compatibilidad con huellas previamente registradas.`,
};

// =====================================================
// PALABRAS CLAVE PARA DETECCIÓN AUTOMÁTICA
// =====================================================

const PALABRAS_CLAVE: Record<keyof typeof DESLINDES_POR_SERVICIO, string[]> = {
  pantalla: [
    "pantalla",
    "display",
    "touch",
    "táctil",
    "tactil",
    "cristal",
    "vidrio",
    "screen",
    "lcd",
    "oled",
  ],
  bateria: [
    "batería",
    "bateria",
    "carga",
    "no carga",
    "battery",
    "duración",
    "duracion",
  ],
  bateria_hinchada: ["hinchada", "inflada", "abultada", "swollen"],
  liquidos: [
    "mojado",
    "agua",
    "líquido",
    "liquido",
    "humedad",
    "oxidado",
    "water",
    "derrame",
  ],
  no_enciende: [
    "no enciende",
    "no prende",
    "muerto",
    "apagado",
    "dead",
    "no arranca",
  ],
  software: [
    "software",
    "sistema",
    "android",
    "ios",
    "formateo",
    "virus",
    "lento",
    "app",
    "aplicación",
    "aplicacion",
  ],
  fisico: [
    "golpeado",
    "roto",
    "quebrado",
    "caída",
    "caida",
    "golpe",
    "fracturado",
  ],
  camara: ["cámara", "camara", "foto", "flash", "lente", "camera"],
  carga: [
    "puerto",
    "conector",
    "no carga",
    "charging",
    "usb",
    "tipo c",
    "lightning",
  ],
  audio: [
    "micrófono",
    "microfono",
    "altavoz",
    "bocina",
    "audio",
    "sonido",
    "speaker",
    "mic",
  ],
  conectividad: ["wifi", "bluetooth", "señal", "senal", "conexión", "conexion"],
  tactil: ["táctil", "tactil", "touch", "responde mal", "no responde"],
  botones: ["botón", "boton", "power", "volumen", "encendido", "button"],
  huella: ["huella", "sensor", "fingerprint", "biométrico", "biometrico"],
};

// =====================================================
// DESLINDE GENERAL (SIEMPRE AL FINAL)
// =====================================================

const DESLINDE_GENERAL = `GENERAL: El cliente acepta que CREDIPHONE realizó el diagnóstico con base en la información proporcionada y las pruebas posibles en el momento de recepción. Cualquier problema no reportado o no detectable inicialmente requerirá cotización y autorización adicional. El cliente exime de responsabilidad a CREDIPHONE por pérdida de datos o información no respaldada previamente.`;

// =====================================================
// FUNCIÓN PRINCIPAL: GENERAR DESLINDES INTELIGENTES
// =====================================================

export function generarDeslindesInteligentes(
  problemaReportado: string,
  condiciones: CondicionesFuncionamiento,
  estadoFisico: EstadoFisicoDispositivo
): string[] {
  const deslindes: string[] = [];
  const problemaLower = problemaReportado.toLowerCase();

  // 1. Analizar problema reportado con palabras clave
  Object.entries(PALABRAS_CLAVE).forEach(([tipo, palabras]) => {
    if (palabras.some((palabra) => problemaLower.includes(palabra))) {
      const deslinde =
        DESLINDES_POR_SERVICIO[tipo as keyof typeof DESLINDES_POR_SERVICIO];
      if (!deslindes.includes(deslinde)) {
        deslindes.push(deslinde);
      }
    }
  });

  // 2. Condiciones especiales que SIEMPRE generan deslindes

  // Llega apagado
  if (
    condiciones.llegaApagado &&
    !deslindes.some((d) => d.includes("SIN ENCENDER"))
  ) {
    deslindes.push(DESLINDES_POR_SERVICIO.no_enciende);
  }

  // Mojado
  if (
    condiciones.estaMojado &&
    !deslindes.some((d) => d.includes("LÍQUIDO"))
  ) {
    deslindes.push(DESLINDES_POR_SERVICIO.liquidos);
  }

  // Batería hinchada
  if (
    condiciones.bateriaHinchada &&
    !deslindes.some((d) => d.includes("HINCHADA"))
  ) {
    deslindes.push(DESLINDES_POR_SERVICIO.bateria_hinchada);
  }

  // 3. Componentes con fallas específicas

  if (
    condiciones.pantallaTactil === "falla" &&
    !deslindes.some((d) => d.includes("PANTALLA"))
  ) {
    deslindes.push(DESLINDES_POR_SERVICIO.pantalla);
  }

  if (
    condiciones.bateria === "falla" &&
    !deslindes.some((d) => d.includes("BATERÍA"))
  ) {
    deslindes.push(DESLINDES_POR_SERVICIO.bateria);
  }

  if (
    condiciones.camaras === "falla" &&
    !deslindes.some((d) => d.includes("CÁMARA"))
  ) {
    deslindes.push(DESLINDES_POR_SERVICIO.camara);
  }

  if (
    (condiciones.microfono === "falla" || condiciones.altavoz === "falla") &&
    !deslindes.some((d) => d.includes("AUDIO"))
  ) {
    deslindes.push(DESLINDES_POR_SERVICIO.audio);
  }

  if (
    (condiciones.wifi === "falla" || condiciones.bluetooth === "falla") &&
    !deslindes.some((d) => d.includes("CONECTIVIDAD"))
  ) {
    deslindes.push(DESLINDES_POR_SERVICIO.conectividad);
  }

  if (
    (condiciones.botonEncendido === "falla" ||
      condiciones.botonesVolumen === "falla") &&
    !deslindes.some((d) => d.includes("BOTONES"))
  ) {
    deslindes.push(DESLINDES_POR_SERVICIO.botones);
  }

  if (
    condiciones.sensorHuella === "falla" &&
    !deslindes.some((d) => d.includes("HUELLA"))
  ) {
    deslindes.push(DESLINDES_POR_SERVICIO.huella);
  }

  // 4. Estado físico muy dañado
  const tieneRoturas = (
    Object.entries(estadoFisico) as [string, EstadoFisico | boolean | string][]
  ).some(([key, val]) => {
    if (
      key === "tieneSIM" ||
      key === "tieneMemoriaSD" ||
      key === "observacionesFisicas"
    ) {
      return false;
    }
    return val === "quebrado" || val === "golpeado";
  });

  if (tieneRoturas && !deslindes.some((d) => d.includes("DAÑO FÍSICO"))) {
    deslindes.push(DESLINDES_POR_SERVICIO.fisico);
  }

  // 5. Agregar deslinde general al final (si no existe ya)
  if (!deslindes.includes(DESLINDE_GENERAL)) {
    deslindes.push(DESLINDE_GENERAL);
  }

  return deslindes;
}

/**
 * Helper para validar si se debe incluir el estado físico en el PDF
 * Solo se incluye si hay daños relevantes
 */
export function debeIncluirEstadoFisicoEnPDF(
  estadoFisico: EstadoFisicoDispositivo
): boolean {
  return (
    Object.entries(estadoFisico) as [string, EstadoFisico | boolean | string][]
  ).some(([key, val]) => {
    if (
      key === "tieneSIM" ||
      key === "tieneMemoriaSD" ||
      key === "observacionesFisicas"
    ) {
      return false;
    }
    return val === "quebrado" || val === "golpeado" || val === "rallado";
  });
}
