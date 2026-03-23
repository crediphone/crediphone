/**
 * ESC/POS Command Builder
 * Soporta impresoras térmicas de 58mm y 80mm.
 * Incluye encoding de caracteres españoles (CP437 por defecto).
 *
 * Referencias:
 *   - Epson ESC/POS Application Programmer's Guide
 *   - Star Micronics ESC/POS Command Reference
 */

// ─── Constantes de protocolo ──────────────────────────────────────────────────

/** ESC/POS byte constants */
const ESC = 0x1b;
const GS  = 0x1d;
const LF  = 0x0a;
const CR  = 0x0d;
const HT  = 0x09;

/** Ancho en caracteres por tamaño de papel */
export const PAPER_CHARS: Record<58 | 80, number> = { 58: 32, 80: 48 };

// ─── Mapa de caracteres españoles → CP437 ─────────────────────────────────────

/**
 * Traduce caracteres Unicode a su equivalente CP437.
 * CP437 es la code page predeterminada en la mayoría de impresoras ESC/POS baratas.
 * Para caracteres sin equivalente, usa ASCII similar o '?'.
 */
const CP437_MAP: Record<string, number> = {
  // Minúsculas con acento
  á: 0xa0, é: 0x82, í: 0xa1, ó: 0xa2, ú: 0xa3,
  ü: 0x81, ñ: 0xa4,
  // Mayúsculas con acento
  Á: 0xb5, É: 0x90, Í: 0xd6, Ó: 0xe0, Ú: 0xe9,
  Ü: 0x9a, Ñ: 0xa5,
  // Signos
  '¡': 0xad, '¿': 0xa8,
  '«': 0xae, '»': 0xaf,
  '°': 0xf8,
  // Símbolos monetarios
  '¢': 0x9b, '£': 0x9c, '¥': 0x9d,
  // Líneas de tabla (fallback ASCII)
  '─': 0xc4, '═': 0xcd,
  '│': 0xb3, '║': 0xba,
  '┌': 0xda, '┐': 0xbf, '└': 0xc0, '┘': 0xd9,
  '├': 0xc3, '┤': 0xb4, '┬': 0xc2, '┴': 0xc1, '┼': 0xc5,
  '▪': 0xfe, '•': 0xf9,
};

/**
 * Convierte un string Unicode a bytes CP437.
 * Caracteres fuera del mapa se convierten a '?' (0x3f).
 */
function toCP437(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 0x80) {
      bytes.push(code); // ASCII directo
    } else if (CP437_MAP[ch] !== undefined) {
      bytes.push(CP437_MAP[ch]);
    } else {
      bytes.push(0x3f); // '?'
    }
  }
  return new Uint8Array(bytes);
}

/** Concatena múltiples Uint8Array en uno solo */
function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ─── Comandos ESC/POS ─────────────────────────────────────────────────────────

export const EscPos = {
  // ── Inicialización ──────────────────────────────────────────────────────────

  /** ESC @ — Inicializar impresora */
  init(): Uint8Array {
    return new Uint8Array([ESC, 0x40]);
  },

  /** Activar CP437 (ESC t 0) — code page predeterminada para español */
  charsetCP437(): Uint8Array {
    return new Uint8Array([ESC, 0x74, 0x00]);
  },

  /** Activar CP1252 / Windows-1252 (ESC t 16) — alternativa con mejor cobertura */
  charsetCP1252(): Uint8Array {
    return new Uint8Array([ESC, 0x74, 0x10]);
  },

  // ── Texto ───────────────────────────────────────────────────────────────────

  /** Escribe texto con encoding CP437 + salto de línea automático */
  text(value: string, newline = true): Uint8Array {
    const textBytes = toCP437(value);
    if (!newline) return textBytes;
    return concat(textBytes, new Uint8Array([LF]));
  },

  /** Avanza líneas en blanco */
  feed(lines = 1): Uint8Array {
    return new Uint8Array(Array(lines).fill(LF));
  },

  // ── Formato de texto ────────────────────────────────────────────────────────

  /** ESC E n — Negrita (1=on, 0=off) */
  bold(on: boolean): Uint8Array {
    return new Uint8Array([ESC, 0x45, on ? 1 : 0]);
  },

  /** ESC - n — Subrayado (0=off, 1=1pt, 2=2pt) */
  underline(mode: 0 | 1 | 2 = 1): Uint8Array {
    return new Uint8Array([ESC, 0x2d, mode]);
  },

  /** ESC a n — Alineación (0=izq, 1=centro, 2=der) */
  align(a: 'left' | 'center' | 'right'): Uint8Array {
    const n = a === 'left' ? 0 : a === 'center' ? 1 : 2;
    return new Uint8Array([ESC, 0x61, n]);
  },

  /**
   * GS ! n — Tamaño de caracter
   * width/height: 0–7 (multiplicador: 1x–8x)
   */
  size(width: 0 | 1 | 2 | 3 = 0, height: 0 | 1 | 2 | 3 = 0): Uint8Array {
    const n = ((width & 0x07) << 4) | (height & 0x07);
    return new Uint8Array([GS, 0x21, n]);
  },

  /** Vuelve al tamaño normal */
  sizeNormal(): Uint8Array {
    return new Uint8Array([GS, 0x21, 0x00]);
  },

  // ── Utilidades de formato ────────────────────────────────────────────────────

  /**
   * Genera una línea divisoria con el caracter dado.
   * @param width Ancho en chars del papel (32 para 58mm, 48 para 80mm)
   */
  divider(char = '-', width: 32 | 48 = 32): Uint8Array {
    return EscPos.text(char.repeat(width));
  },

  /**
   * Genera una fila con texto izquierdo y texto derecho alineado.
   * Ejemplo: "Subtotal          $120.00"
   */
  row(left: string, right: string, width: 32 | 48 = 32): Uint8Array {
    const spaceCount = Math.max(1, width - left.length - right.length);
    return EscPos.text(left + ' '.repeat(spaceCount) + right);
  },

  /**
   * Centra un texto dentro del ancho del papel (sin usar el comando ESC a).
   * Útil cuando ya tienes alineación activa y quieres centrar manualmente.
   */
  center(text: string, width: 32 | 48 = 32): Uint8Array {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return EscPos.text(' '.repeat(pad) + text);
  },

  // ── Código QR ───────────────────────────────────────────────────────────────

  /**
   * Genera un código QR usando el protocolo GS ( k de 2 bytes (ESC/POS estándar).
   * Compatible con Epson TM, la mayoría de impresoras genéricas modernas.
   *
   * @param data Contenido del QR (URL, texto, etc.)
   * @param size Tamaño del módulo (3–8; default 4 ≈ ~25mm en 58mm)
   * @param errorLevel L/M/Q/H (0/1/2/3)
   */
  qrCode(data: string, size = 4, errorLevel: 0 | 1 | 2 | 3 = 1): Uint8Array {
    const dataBytes = new TextEncoder().encode(data);
    const dataLen = dataBytes.length + 3; // +3 para pL, pH, cn, fn
    const pL = dataLen & 0xff;
    const pH = (dataLen >> 8) & 0xff;

    const cmds: Uint8Array[] = [];

    // Modelo QR 2 (mejor compatibilidad): GS ( k 4 0 49 65 50 0
    cmds.push(new Uint8Array([GS, 0x28, 0x6b, 4, 0, 49, 65, 50, 0]));

    // Tamaño módulo: GS ( k 3 0 49 67 n
    cmds.push(new Uint8Array([GS, 0x28, 0x6b, 3, 0, 49, 67, size]));

    // Nivel de corrección: GS ( k 3 0 49 69 n (48=L 49=M 50=Q 51=H)
    cmds.push(new Uint8Array([GS, 0x28, 0x6b, 3, 0, 49, 69, 48 + errorLevel]));

    // Almacenar datos: GS ( k pL pH 49 80 30 <data>
    const storeCmd = new Uint8Array(6 + dataBytes.length);
    storeCmd.set([GS, 0x28, 0x6b, pL, pH, 49, 80, 30]);
    storeCmd.set(dataBytes, 6); // ← corregido: offset 6 (no 8)
    // Ajustar: GS 0x28 0x6b + pL + pH (2 bytes) + [49 80 30] = 3 header bytes del payload
    // En realidad: GS ( k = 2 bytes, luego pL, pH, entonces los datos (cn, fn, m=30, datos)
    // Recalcular:
    const storeFixed = concat(
      new Uint8Array([GS, 0x28, 0x6b, pL, pH, 49, 80, 30]),
      dataBytes
    );
    cmds.push(storeFixed);

    // Imprimir: GS ( k 3 0 49 81 48
    cmds.push(new Uint8Array([GS, 0x28, 0x6b, 3, 0, 49, 81, 48]));

    return concat(...cmds.slice(0, 3), storeFixed, cmds[cmds.length - 1]);
  },

  /**
   * Código de barras Code128.
   * GS k m d1...dk NUL
   * m=73 (Code128), seguido de los datos + 0x00
   */
  barcode128(data: string): Uint8Array {
    const dataBytes = new TextEncoder().encode(data);
    const cmd = new Uint8Array(3 + dataBytes.length + 1);
    cmd.set([GS, 0x6b, 73]); // GS k + Code128
    cmd.set(dataBytes, 3);
    cmd[cmd.length - 1] = 0x00; // NUL terminator
    return cmd;
  },

  // ── Corte de papel ──────────────────────────────────────────────────────────

  /**
   * GS V — Corte de papel.
   * @param full true=corte completo, false=corte parcial (deja pestaña)
   */
  cut(full = false): Uint8Array {
    // Avanzar papel antes de cortar para que salga bien
    return concat(
      EscPos.feed(4),
      new Uint8Array([GS, 0x56, full ? 0x00 : 0x01])
    );
  },

  /** Pulso de caja registradora (pin 2 o pin 5) */
  cashDrawer(pin: 2 | 5 = 2): Uint8Array {
    // ESC p m t1 t2 — on: m=0(pin2)/1(pin5), t1=25ms pulso, t2=250ms off
    return new Uint8Array([ESC, 0x70, pin === 2 ? 0 : 1, 50, 250]);
  },

  // ── Builder de ticket completo ───────────────────────────────────────────────

  /**
   * Construye un Uint8Array final a partir de múltiples comandos.
   * Uso: EscPos.build([EscPos.init(), EscPos.bold(true), EscPos.text("Hola")])
   */
  build(commands: Uint8Array[]): Uint8Array {
    return concat(...commands);
  },
} as const;

// ─── Helper: dividir en chunks para BLE ──────────────────────────────────────

/**
 * Divide un Uint8Array en chunks de tamaño máximo.
 * Necesario porque BLE tiene MTU limitado (20-512 bytes según dispositivo).
 */
export function chunkBytes(data: Uint8Array, chunkSize = 512): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
}

/** Convierte Uint8Array a string base64 (para envío por red/URL scheme) */
export function toBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/** Convierte base64 a Uint8Array */
export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
