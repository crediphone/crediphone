/**
 * Adaptador Web Bluetooth para impresoras térmicas.
 *
 * Soporta múltiples perfiles BLE:
 *  - Nordic UART Service (las más comunes en impresoras baratas)
 *  - Generic Printer Service
 *  - Elegate / Goojprt y clones
 *  - Microchip BM70/BM71
 *
 * Limitaciones del estándar:
 *  - Solo disponible en Chrome/Edge en contexto HTTPS
 *  - No funciona en iOS Safari (Apple bloquea Web Bluetooth)
 *  - Requiere gesto del usuario para llamar requestDevice()
 */

import { chunkBytes } from './escpos';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface BluetoothPrinterInfo {
  id: string;
  name: string;
  profileUsed: string;
}

export interface BluetoothPrinterConfig {
  /** Tamaño de chunk en bytes (default 512; algunos printers viejos solo soportan 20) */
  chunkSize?: number;
  /** Delay en ms entre chunks para no saturar el buffer del printer (default 20ms) */
  chunkDelayMs?: number;
}

/** Estado de la impresora Bluetooth */
export type BTPrinterState = 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';

// ─── Perfiles BLE soportados ──────────────────────────────────────────────────

interface BLEProfile {
  name: string;
  /** Service UUID (se pasa a optionalServices en requestDevice) */
  serviceUuid: string;
  /** UUID de la característica de escritura */
  writeUuid: string;
  /** UUID de la característica de lectura/notificación (opcional) */
  readUuid?: string;
}

const BLE_PROFILES: BLEProfile[] = [
  // ── Nordic UART Service ─────────────────────────────────────────────────────
  // Usado por: la gran mayoría de impresoras 58mm baratas de AliExpress, Mercado Libre
  // También: Elegate EP-5802AI, Goojprt PT-210, y muchos clones
  {
    name: 'Nordic UART',
    serviceUuid: '6e400001-b5b4-f393-e0a9-e50e24dcca9e',
    writeUuid:   '6e400002-b5b4-f393-e0a9-e50e24dcca9e',
    readUuid:    '6e400003-b5b4-f393-e0a9-e50e24dcca9e',
  },
  // ── Generic Printer Service (Bixolon, algunas Epson BLE) ───────────────────
  {
    name: 'Generic Printer',
    serviceUuid: '000018f0-0000-1000-8000-00805f9b34fb',
    writeUuid:   '00002af1-0000-1000-8000-00805f9b34fb',
  },
  // ── Elegate-specific / MP-series / WH-specific ─────────────────────────────
  // Elegate EP-200 series y printers con este servicio específico
  {
    name: 'Elegate/MP Series',
    serviceUuid: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    writeUuid:   'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  },
  // ── Microchip BM70/BM71 ────────────────────────────────────────────────────
  {
    name: 'Microchip UART',
    serviceUuid: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    writeUuid:   '49535343-8841-43f4-a8d4-ecbe34729bb3',
    readUuid:    '49535343-1e4d-4bd9-ba61-23c647249616',
  },
  // ── Star Micronics TSP/mPOP BLE ─────────────────────────────────────────────
  // Star usa un service UUID propio en sus modelos BLE
  {
    name: 'Star Micronics',
    serviceUuid: '00001101-0000-1000-8000-00805f9b34fb',
    writeUuid:   '00001101-0000-1000-8000-00805f9b34fb',
  },
];

/** Todos los service UUIDs para incluir en optionalServices */
const ALL_SERVICE_UUIDS = BLE_PROFILES.map(p => p.serviceUuid);

// ─── Clase principal ──────────────────────────────────────────────────────────

export class BluetoothThermalPrinter {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writeChar: BluetoothRemoteGATTCharacteristic | null = null;
  private profileName = '';

  public state: BTPrinterState = 'disconnected';
  public printerInfo: BluetoothPrinterInfo | null = null;

  private config: Required<BluetoothPrinterConfig>;

  constructor(config: BluetoothPrinterConfig = {}) {
    this.config = {
      chunkSize: config.chunkSize ?? 512,
      chunkDelayMs: config.chunkDelayMs ?? 20,
    };
  }

  // ─── Detección de soporte ─────────────────────────────────────────────────

  /** true si el browser soporta Web Bluetooth */
  static isSupported(): boolean {
    return typeof navigator !== 'undefined' &&
           'bluetooth' in navigator;
  }

  /** true si es un contexto seguro (HTTPS o localhost) */
  static isSecureContext(): boolean {
    return typeof window !== 'undefined' && window.isSecureContext;
  }

  /** Retorna el motivo por el que no está disponible, o null si sí está disponible */
  static unavailableReason(): string | null {
    if (!BluetoothThermalPrinter.isSecureContext()) {
      return 'Requiere HTTPS. En localhost funciona normalmente.';
    }
    if (!BluetoothThermalPrinter.isSupported()) {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      if (/iPhone|iPad/.test(ua)) {
        return 'iOS no soporta Web Bluetooth. Usa la app de tu impresora o impresión por red.';
      }
      if (/Firefox/.test(ua)) {
        return 'Firefox no soporta Web Bluetooth. Usa Chrome o Edge.';
      }
      return 'Tu navegador no soporta Web Bluetooth. Usa Chrome en Android.';
    }
    return null;
  }

  // ─── Conexión ─────────────────────────────────────────────────────────────

  /**
   * Abre el selector Bluetooth del navegador y conecta a la impresora.
   * DEBE ser llamado desde un gesto del usuario (click).
   */
  async connect(): Promise<BluetoothPrinterInfo> {
    if (!BluetoothThermalPrinter.isSupported()) {
      throw new Error(BluetoothThermalPrinter.unavailableReason() ?? 'Web Bluetooth no disponible');
    }

    this.state = 'connecting';

    try {
      // Solicitar dispositivo — acepta impresoras con cualquiera de los servicios
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ALL_SERVICE_UUIDS,
      });

      this.device.addEventListener('gattserverdisconnected', () => {
        this.state = 'disconnected';
        this.writeChar = null;
        this.server = null;
        this.printerInfo = null;
      });

      // Conectar al servidor GATT
      this.server = await this.device.gatt!.connect();

      // Probar cada perfil hasta encontrar uno que funcione
      this.writeChar = await this._findWriteCharacteristic();

      const info: BluetoothPrinterInfo = {
        id: this.device.id,
        name: this.device.name ?? 'Impresora Bluetooth',
        profileUsed: this.profileName,
      };

      this.state = 'connected';
      this.printerInfo = info;
      return info;
    } catch (err) {
      this.state = 'error';
      // Si el usuario canceló el selector, lanzar mensaje amigable
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        throw new Error('No se seleccionó ninguna impresora.');
      }
      throw err;
    }
  }

  /**
   * Intenta encontrar la característica de escritura probando cada perfil.
   */
  private async _findWriteCharacteristic(): Promise<BluetoothRemoteGATTCharacteristic> {
    if (!this.server) throw new Error('No hay servidor GATT conectado.');

    for (const profile of BLE_PROFILES) {
      try {
        const service = await this.server.getPrimaryService(profile.serviceUuid);
        const char = await service.getCharacteristic(profile.writeUuid);
        this.profileName = profile.name;
        console.info(`[BT Printer] Perfil detectado: ${profile.name}`);
        return char;
      } catch {
        // Este perfil no existe en esta impresora, probar el siguiente
      }
    }

    throw new Error(
      'No se pudo identificar el tipo de impresora. ' +
      'Asegúrate de que la impresora esté encendida y en modo pairing.'
    );
  }

  /** Desconectar limpiamente */
  disconnect(): void {
    this.device?.gatt?.disconnect();
    this.device = null;
    this.server = null;
    this.writeChar = null;
    this.state = 'disconnected';
    this.printerInfo = null;
  }

  get isConnected(): boolean {
    return this.state === 'connected' || this.state === 'printing';
  }

  // ─── Impresión ────────────────────────────────────────────────────────────

  /**
   * Envía datos ESC/POS a la impresora en chunks.
   * @param data Bytes ESC/POS a imprimir
   */
  async print(data: Uint8Array): Promise<void> {
    if (!this.writeChar) {
      throw new Error('Impresora no conectada. Conecta primero.');
    }

    this.state = 'printing';

    try {
      const chunks = chunkBytes(data, this.config.chunkSize);

      for (const chunk of chunks) {
        // writeValueWithoutResponse es más rápido pero puede perder datos
        // writeValueWithResponse es más lento pero confiable
        try {
          await this.writeChar.writeValueWithResponse(chunk);
        } catch {
          // Fallback: algunos printers solo soportan sin respuesta
          await this.writeChar.writeValueWithoutResponse(chunk);
        }

        if (chunks.length > 1 && this.config.chunkDelayMs > 0) {
          await delay(this.config.chunkDelayMs);
        }
      }

      this.state = 'connected';
    } catch (err) {
      this.state = 'error';
      throw err;
    }
  }

  /**
   * Reconecta si se desconectó accidentalmente, luego imprime.
   */
  async printWithReconnect(data: Uint8Array): Promise<void> {
    if (!this.isConnected && this.device) {
      try {
        this.state = 'connecting';
        this.server = await this.device.gatt!.connect();
        this.writeChar = await this._findWriteCharacteristic();
        this.state = 'connected';
      } catch {
        throw new Error('No se pudo reconectar. Intenta conectar de nuevo.');
      }
    }
    return this.print(data);
  }
}

// ─── Singleton (instancia global por pestaña) ─────────────────────────────────

let _globalPrinter: BluetoothThermalPrinter | null = null;

export function getBluetoothPrinter(): BluetoothThermalPrinter {
  if (!_globalPrinter) {
    _globalPrinter = new BluetoothThermalPrinter();
  }
  return _globalPrinter;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
