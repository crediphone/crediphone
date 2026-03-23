"use client";

/**
 * Hook React para gestionar la impresora térmica.
 *
 * Soporta:
 *  - Bluetooth BLE (múltiples marcas/perfiles)
 *  - Impresión por red WiFi/IP
 *  - RawBT y otras apps vía URL scheme
 *  - Fallback a browser print (HTML)
 *
 * Guarda la configuración preferida en localStorage para que persista
 * entre sesiones (IP de red, método preferido, tamaño de papel).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { BluetoothThermalPrinter, getBluetoothPrinter } from "@/lib/print/bluetooth-printer";
import {
  printViaBluetooth,
  printViaNetwork,
  printViaRawBT,
  printViaShare,
  printViaBrowser,
  openPrinterApp,
  type PrintMethod,
  type PrintResult,
  type NetworkPrinterConfig,
} from "@/lib/print/print-strategies";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PrinterSettings {
  /** Método preferido de impresión */
  method: PrintMethod;
  /** Tamaño del papel en mm */
  paperWidth: 58 | 80;
  /** Corte automático de papel */
  autocut: boolean;
  /** Config de impresora de red (IP, puerto) */
  network?: NetworkPrinterConfig;
  /** Nombre/ID del último BT conectado (para info al usuario) */
  lastBTName?: string;
}

const STORAGE_KEY = 'crediphone_printer_settings';

const DEFAULT_SETTINGS: PrinterSettings = {
  method: 'browser',
  paperWidth: 58,
  autocut: true,
};

function loadSettings(): PrinterSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: PrinterSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // localStorage lleno o no disponible — ignorar
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseThermalPrinterReturn {
  /** true si Web Bluetooth está soportado en este browser */
  isBluetoothSupported: boolean;
  /** Razón por la que BT no está disponible (null si sí está disponible) */
  bluetoothUnavailableReason: string | null;
  /** Estado actual de la conexión BT */
  btState: 'disconnected' | 'connecting' | 'connected' | 'printing' | 'error';
  /** Nombre del dispositivo BT conectado */
  btPrinterName: string | null;
  /** Configuración actual */
  settings: PrinterSettings;
  /** Actualiza la configuración */
  updateSettings: (partial: Partial<PrinterSettings>) => void;
  /** Conecta a una impresora Bluetooth (debe ser llamado desde un click) */
  connectBluetooth: () => Promise<void>;
  /** Desconecta la impresora BT */
  disconnectBluetooth: () => void;
  /** Imprime datos ESC/POS con la estrategia configurada */
  print: (escposData: Uint8Array, htmlFallback?: string) => Promise<PrintResult>;
  /** Imprime via app específica (RawBT, Sunmi, Brother, PrintHand) */
  printViaApp: (app: 'rawbt' | 'sunmi' | 'brother' | 'printhand', data: Uint8Array) => void;
  /** true si hay una impresión en curso */
  isPrinting: boolean;
  /** Último error de impresión */
  lastError: string | null;
}

export function useThermalPrinter(): UseThermalPrinterReturn {
  const printerRef = useRef<BluetoothThermalPrinter | null>(null);
  const [btState, setBtState] = useState<BluetoothThermalPrinter['state']>('disconnected');
  const [btPrinterName, setBtPrinterName] = useState<string | null>(null);
  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Cargar settings al montar (client-only)
  useEffect(() => {
    setSettings(loadSettings());
    printerRef.current = getBluetoothPrinter();
  }, []);

  // Sincronizar estado BT
  useEffect(() => {
    const interval = setInterval(() => {
      if (printerRef.current) {
        const state = printerRef.current.state;
        setBtState(state);
        setBtPrinterName(printerRef.current.printerInfo?.name ?? null);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const updateSettings = useCallback((partial: Partial<PrinterSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const connectBluetooth = useCallback(async () => {
    if (!printerRef.current) {
      printerRef.current = getBluetoothPrinter();
    }
    const printer = printerRef.current;
    setBtState('connecting');
    setLastError(null);

    try {
      const info = await printer.connect();
      setBtState('connected');
      setBtPrinterName(info.name);
      updateSettings({ method: 'bluetooth', lastBTName: info.name });
    } catch (err) {
      setBtState('error');
      const msg = err instanceof Error ? err.message : 'Error al conectar';
      setLastError(msg);
      throw err;
    }
  }, [updateSettings]);

  const disconnectBluetooth = useCallback(() => {
    printerRef.current?.disconnect();
    setBtState('disconnected');
    setBtPrinterName(null);
  }, []);

  const print = useCallback(async (
    escposData: Uint8Array,
    htmlFallback?: string
  ): Promise<PrintResult> => {
    setIsPrinting(true);
    setLastError(null);

    try {
      const method = settings.method;
      let result: PrintResult;

      switch (method) {
        case 'bluetooth': {
          const printer = printerRef.current;
          if (!printer) {
            result = { success: false, method: 'bluetooth', error: 'No hay impresora BT' };
          } else {
            result = await printViaBluetooth(escposData, printer);
          }
          break;
        }

        case 'rawbt':
          result = printViaRawBT(escposData);
          break;

        case 'share':
          result = await printViaShare(escposData, 'ticket-crediphone');
          break;

        case 'network':
          if (!settings.network) {
            result = { success: false, method: 'network', error: 'No hay IP de impresora configurada.' };
          } else {
            result = await printViaNetwork(escposData, settings.network);
          }
          break;

        case 'browser':
        default:
          if (!htmlFallback) {
            result = { success: false, method: 'browser', error: 'No hay HTML para imprimir.' };
          } else {
            result = printViaBrowser(htmlFallback);
          }
          break;
      }

      // Si falló el método preferido y hay HTML, intentar browser como último recurso
      if (!result.success && htmlFallback && method !== 'browser') {
        console.warn(`[print] ${method} falló (${result.error}). Cayendo a browser.`);
        result = printViaBrowser(htmlFallback);
      }

      if (!result.success) {
        setLastError(result.error ?? 'Error desconocido');
      }

      return result;
    } finally {
      setIsPrinting(false);
    }
  }, [settings]);

  const printViaAppMethod = useCallback((
    app: 'rawbt' | 'sunmi' | 'brother' | 'printhand',
    data: Uint8Array
  ) => {
    openPrinterApp(app, data);
  }, []);

  return {
    isBluetoothSupported: BluetoothThermalPrinter.isSupported(),
    bluetoothUnavailableReason: BluetoothThermalPrinter.unavailableReason(),
    btState,
    btPrinterName,
    settings,
    updateSettings,
    connectBluetooth,
    disconnectBluetooth,
    print,
    printViaApp: printViaAppMethod,
    isPrinting,
    lastError,
  };
}
