/**
 * Estrategias de impresión térmica — fallback automático.
 *
 * Orden de prioridad:
 *   1. Bluetooth directo (Web Bluetooth API — Android Chrome)
 *   2. App RawBT (Android — URL scheme rawbt://)
 *   3. App de impresora via Share API (Navigator.share + archivo .bin)
 *   4. Red WiFi/IP (TCP port 9100 vía API server-side)
 *   5. Browser (window.print() — CSS thermal, fallback universal)
 *
 * Marcas soportadas:
 *   - Genéricas BLE (Elegate, Goojprt, etc.)
 *   - Sunmi (intent Android)
 *   - Star Micronics (StarWebPRNT o URL scheme)
 *   - Epson TM (ePOS-Print HTTP API)
 *   - Brother (URL scheme o red)
 */

import { BluetoothThermalPrinter } from './bluetooth-printer';
import { toBase64 } from './escpos';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PrintMethod = 'bluetooth' | 'rawbt' | 'share' | 'network' | 'browser';

export interface PrintResult {
  success: boolean;
  method: PrintMethod;
  error?: string;
}

export interface NetworkPrinterConfig {
  ip: string;
  port?: number;      // default 9100
  brand?: 'generic' | 'epson' | 'star';
}

export interface PrintConfig {
  /** Estrategia preferida. Si falla, cae a las siguientes. */
  preferredMethod?: PrintMethod;
  /** Configuración de impresora de red (opcional) */
  network?: NetworkPrinterConfig;
  /** Instancia Bluetooth ya conectada (del hook useThermalPrinter) */
  bluetoothPrinter?: BluetoothThermalPrinter;
  /** HTML para el fallback de browser print */
  htmlFallback?: string;
  /** Nombre del archivo para compartir (sin extensión) */
  fileName?: string;
}

// ─── Estrategia 1: Bluetooth directo ─────────────────────────────────────────

export async function printViaBluetooth(
  data: Uint8Array,
  printer: BluetoothThermalPrinter
): Promise<PrintResult> {
  if (!BluetoothThermalPrinter.isSupported()) {
    return {
      success: false,
      method: 'bluetooth',
      error: BluetoothThermalPrinter.unavailableReason() ?? 'No disponible',
    };
  }

  if (!printer.isConnected) {
    return {
      success: false,
      method: 'bluetooth',
      error: 'Impresora no conectada. Conecta primero desde el botón de Bluetooth.',
    };
  }

  try {
    await printer.printWithReconnect(data);
    return { success: true, method: 'bluetooth' };
  } catch (err) {
    return {
      success: false,
      method: 'bluetooth',
      error: err instanceof Error ? err.message : 'Error al imprimir por Bluetooth',
    };
  }
}

// ─── Estrategia 2: RawBT (Android app) ───────────────────────────────────────

/**
 * RawBT es la app más popular en Android para imprimir ESC/POS directamente.
 * La URL scheme es: rawbt://<base64_data>
 *
 * También soporta Sunmi via Android Intent.
 */
export function printViaRawBT(data: Uint8Array): PrintResult {
  try {
    const b64 = toBase64(data);

    // Intent de Android para RawBT
    const intentUrl =
      `intent://rawbt;base64,${b64}` +
      `#Intent;scheme=rawbt;` +
      `package=ru.a402d.rawbtprinter;` +
      `end`;

    // Intento con el intent de Android primero, luego el URL scheme simple
    const link = document.createElement('a');
    link.href = intentUrl;
    link.click();

    return { success: true, method: 'rawbt' };
  } catch (err) {
    return {
      success: false,
      method: 'rawbt',
      error: err instanceof Error ? err.message : 'No se pudo abrir RawBT',
    };
  }
}

/**
 * Intenta abrir la app de impresora Sunmi (Android).
 * Usa el intent nativo de Sunmi para enviar ESC/POS.
 */
export function printViaSunmi(data: Uint8Array): PrintResult {
  try {
    const b64 = toBase64(data);
    // Sunmi PrinterService intent
    const intentUrl =
      `intent://print;base64,${b64}` +
      `#Intent;scheme=sunmiprinter;` +
      `package=com.sunmi.printerservice;` +
      `end`;

    const link = document.createElement('a');
    link.href = intentUrl;
    link.click();

    return { success: true, method: 'rawbt' };
  } catch (err) {
    return {
      success: false,
      method: 'rawbt',
      error: err instanceof Error ? err.message : 'No se pudo abrir Sunmi',
    };
  }
}

// ─── Estrategia 3: Web Share API ─────────────────────────────────────────────

/**
 * Comparte el archivo .bin ESC/POS con cualquier app instalada (PrintHand, etc.).
 * Funciona en iOS Safari con apps que registran el tipo MIME.
 */
export async function printViaShare(
  data: Uint8Array,
  fileName = 'ticket'
): Promise<PrintResult> {
  if (typeof navigator === 'undefined' || !('share' in navigator)) {
    return {
      success: false,
      method: 'share',
      error: 'Web Share API no disponible en este dispositivo.',
    };
  }

  try {
    const file = new File([data.buffer as ArrayBuffer], `${fileName}.bin`, {
      type: 'application/octet-stream',
    });

    await navigator.share({
      title: 'Imprimir ticket',
      files: [file],
    });

    return { success: true, method: 'share' };
  } catch (err) {
    // El usuario canceló el selector → no es un error real
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, method: 'share', error: 'Cancelado por el usuario.' };
    }
    return {
      success: false,
      method: 'share',
      error: err instanceof Error ? err.message : 'Error al compartir',
    };
  }
}

// ─── Estrategia 4: Red WiFi/IP (server-side TCP) ─────────────────────────────

/**
 * Envía los bytes ESC/POS al servidor Next.js, que los reenvía por TCP a la
 * impresora de red (puerto 9100 por defecto).
 *
 * Para Epson TM: puede usar la API ePOS-Print HTTP nativa.
 * Para Star Micronics: soporta WebPRNT HTTP.
 * Para impresoras genéricas: TCP directo en puerto 9100.
 */
export async function printViaNetwork(
  data: Uint8Array,
  config: NetworkPrinterConfig
): Promise<PrintResult> {
  try {
    const brand = config.brand ?? 'generic';

    if (brand === 'epson') {
      // Epson ePOS-Print HTTP API (disponible en TM-m30, TM-T88VI, etc.)
      return await printEpsonEPOS(data, config);
    }

    if (brand === 'star') {
      // Star WebPRNT
      return await printStarWebPRNT(data, config);
    }

    // Genérico: TCP en puerto 9100 via server-side API
    const b64 = toBase64(data);
    const response = await fetch('/api/print/network', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: config.ip,
        port: config.port ?? 9100,
        data: b64,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        method: 'network',
        error: result.error ?? `Error HTTP ${response.status}`,
      };
    }

    return { success: true, method: 'network' };
  } catch (err) {
    return {
      success: false,
      method: 'network',
      error: err instanceof Error ? err.message : 'Error de red',
    };
  }
}

/** Epson ePOS-Print API (disponible en la IP de la impresora) */
async function printEpsonEPOS(
  data: Uint8Array,
  config: NetworkPrinterConfig
): Promise<PrintResult> {
  try {
    // ePOS-Print XML — envuelve los bytes ESC/POS en el protocolo HTTP de Epson
    const b64 = toBase64(data);
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
  <text>${b64}</text>
</epos-print>`;

    const url = `http://${config.ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '""',
      },
      body: xml,
    });

    if (!response.ok) {
      // Fallback: intentar TCP genérico
      return await printViaNetwork(data, { ...config, brand: 'generic' });
    }

    return { success: true, method: 'network' };
  } catch {
    return await printViaNetwork(data, { ...config, brand: 'generic' });
  }
}

/** Star WebPRNT API */
async function printStarWebPRNT(
  data: Uint8Array,
  config: NetworkPrinterConfig
): Promise<PrintResult> {
  try {
    const url = `http://${config.ip}/StarWebPRNT/SendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: data.buffer as ArrayBuffer,
    });

    if (!response.ok) {
      return await printViaNetwork(data, { ...config, brand: 'generic' });
    }
    return { success: true, method: 'network' };
  } catch {
    return await printViaNetwork(data, { ...config, brand: 'generic' });
  }
}

// ─── Estrategia 5: Browser print (HTML) ──────────────────────────────────────

/**
 * Abre el HTML del ticket en una ventana emergente y activa window.print().
 * Fallback universal — funciona en todos los dispositivos con cualquier impresora.
 */
export function printViaBrowser(html: string, autoprint = true): PrintResult {
  try {
    const win = window.open('', '_blank', 'width=420,height=800,scrollbars=yes');
    if (!win) {
      return {
        success: false,
        method: 'browser',
        error: 'Popups bloqueados. Permite popups para este sitio e intenta de nuevo.',
      };
    }

    win.document.write(html);
    win.document.close();

    if (autoprint) {
      win.onload = () => setTimeout(() => win.print(), 300);
    }

    return { success: true, method: 'browser' };
  } catch (err) {
    return {
      success: false,
      method: 'browser',
      error: err instanceof Error ? err.message : 'Error al imprimir',
    };
  }
}

// ─── Estrategia inteligente con fallback automático ───────────────────────────

/**
 * Intenta imprimir con la estrategia preferida.
 * Si falla o no está disponible, cae automáticamente a la siguiente.
 *
 * Orden de fallback: bluetooth → rawbt → network → browser
 */
export async function printWithFallback(
  escposData: Uint8Array,
  config: PrintConfig
): Promise<PrintResult> {
  const preferred = config.preferredMethod ?? 'bluetooth';
  const methods: PrintMethod[] = buildMethodOrder(preferred);

  for (const method of methods) {
    let result: PrintResult;

    switch (method) {
      case 'bluetooth':
        if (!config.bluetoothPrinter?.isConnected) continue;
        result = await printViaBluetooth(escposData, config.bluetoothPrinter);
        break;

      case 'rawbt':
        result = printViaRawBT(escposData);
        break;

      case 'share':
        result = await printViaShare(escposData, config.fileName ?? 'ticket');
        break;

      case 'network':
        if (!config.network) continue;
        result = await printViaNetwork(escposData, config.network);
        break;

      case 'browser':
        if (!config.htmlFallback) continue;
        result = printViaBrowser(config.htmlFallback);
        break;

      default:
        continue;
    }

    if (result.success) return result;
    console.warn(`[print] Estrategia "${method}" falló: ${result.error}. Intentando siguiente...`);
  }

  // Si todo falla
  return {
    success: false,
    method: 'browser',
    error: 'No se encontró ningún método de impresión disponible.',
  };
}

function buildMethodOrder(preferred: PrintMethod): PrintMethod[] {
  const all: PrintMethod[] = ['bluetooth', 'rawbt', 'share', 'network', 'browser'];
  return [preferred, ...all.filter(m => m !== preferred)];
}

// ─── URL Schemes de apps específicas ─────────────────────────────────────────

/**
 * Genera el URL scheme para Brother iPrint&Scan (impresión directa).
 * Se abre en el navegador y si la app está instalada, la activa.
 */
export function brotherScheme(data: Uint8Array): string {
  const b64 = toBase64(data);
  return `brother://print?data=${encodeURIComponent(b64)}`;
}

/**
 * URL scheme para PrintHand (Android/iOS).
 */
export function printHandScheme(data: Uint8Array): string {
  const b64 = toBase64(data);
  return `printhand://print?data=${encodeURIComponent(b64)}`;
}

/** Intenta abrir una app específica por URL scheme */
export function openPrinterApp(
  brand: 'rawbt' | 'sunmi' | 'brother' | 'printhand',
  data: Uint8Array
): void {
  let url: string;

  switch (brand) {
    case 'rawbt':
      url = `rawbt://base64,${toBase64(data)}`;
      break;
    case 'sunmi':
      url = `intent://print;data=${toBase64(data)}#Intent;scheme=sunmiprinter;package=com.sunmi.printerservice;end`;
      break;
    case 'brother':
      url = brotherScheme(data);
      break;
    case 'printhand':
      url = printHandScheme(data);
      break;
  }

  const a = document.createElement('a');
  a.href = url;
  a.click();
}
