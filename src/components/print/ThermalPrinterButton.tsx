"use client";

/**
 * ThermalPrinterButton — Botón para imprimir en impresora térmica.
 *
 * Modos:
 *  - Impresión directa si ya hay impresora BT conectada o IP configurada
 *  - Muestra menú desplegable con opciones si no hay método activo
 *
 * Uso en ReciboModal u OrdenDetailHeader:
 * ```tsx
 * <ThermalPrinterButton
 *   escposData={buildTicketVentaPOS(data, empresa)}
 *   htmlFallback={ticketHtml}
 *   label="Imprimir ticket"
 * />
 * ```
 */

import { useState, useRef, useEffect } from "react";
import { Printer, Bluetooth, Wifi, Smartphone, ChevronDown, X, Settings } from "lucide-react";
import { useThermalPrinter } from "@/hooks/useThermalPrinter";
import { openPrinterApp } from "@/lib/print/print-strategies";
import type { PrintMethod } from "@/lib/print/print-strategies";

interface ThermalPrinterButtonProps {
  /** Bytes ESC/POS listos para imprimir */
  escposData?: Uint8Array;
  /** HTML del ticket (fallback para browser print y botón BT sin conexión) */
  htmlFallback?: string;
  /** Texto del botón principal */
  label?: string;
  /** Tamaño del botón */
  size?: 'sm' | 'md';
  /** Muestra solo el ícono sin texto */
  iconOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Etiquetas amigables por método */
const METHOD_LABELS: Record<PrintMethod, { label: string; icon: React.ReactNode; desc: string }> = {
  bluetooth: {
    label: 'Bluetooth',
    icon: <Bluetooth className="w-4 h-4" />,
    desc: 'Directo al BT emparejado',
  },
  rawbt: {
    label: 'App RawBT',
    icon: <Smartphone className="w-4 h-4" />,
    desc: 'Abre la app RawBT',
  },
  share: {
    label: 'Compartir a app',
    icon: <Smartphone className="w-4 h-4" />,
    desc: 'Compartir con app de impresora',
  },
  network: {
    label: 'Red WiFi',
    icon: <Wifi className="w-4 h-4" />,
    desc: 'Impresora en la misma red',
  },
  browser: {
    label: 'Browser',
    icon: <Printer className="w-4 h-4" />,
    desc: 'Diálogo de impresión',
  },
};

export function ThermalPrinterButton({
  escposData,
  htmlFallback,
  label = "Imprimir",
  size = 'md',
  iconOnly = false,
  className = '',
  style,
}: ThermalPrinterButtonProps) {
  const {
    isBluetoothSupported,
    bluetoothUnavailableReason,
    btState,
    btPrinterName,
    settings,
    updateSettings,
    connectBluetooth,
    disconnectBluetooth,
    print,
    isPrinting,
    lastError,
  } = useThermalPrinter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [networkIp, setNetworkIp] = useState(settings.network?.ip ?? '');
  const [networkPort, setNetworkPort] = useState(String(settings.network?.port ?? 9100));
  const [printFeedback, setPrintFeedback] = useState<'idle' | 'success' | 'error'>('idle');

  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handlePrint = async () => {
    if (!escposData && !htmlFallback) return;
    setPrintFeedback('idle');
    setMenuOpen(false);

    const data = escposData ?? new Uint8Array();
    const result = await print(data, htmlFallback);
    setPrintFeedback(result.success ? 'success' : 'error');
    setTimeout(() => setPrintFeedback('idle'), 3000);
  };

  const handleConnectBT = async () => {
    try {
      await connectBluetooth();
      setMenuOpen(false);
    } catch {
      // error ya guardado en lastError
    }
  };

  const handleSaveNetworkConfig = () => {
    const port = parseInt(networkPort, 10);
    updateSettings({
      method: 'network',
      network: {
        ip: networkIp,
        port: isNaN(port) ? 9100 : port,
        brand: 'generic',
      },
    });
    setConfigOpen(false);
    setMenuOpen(false);
  };

  const isDisabled = isPrinting || (!escposData && !htmlFallback);

  const btConnected = btState === 'connected' || btState === 'printing';
  const btConnecting = btState === 'connecting';

  // ── Color del ícono de estado ───────────────────────────────────────────────
  const statusColor = btConnected
    ? 'var(--color-success)'
    : btConnecting
    ? 'var(--color-warning)'
    : printFeedback === 'success'
    ? 'var(--color-success)'
    : printFeedback === 'error'
    ? 'var(--color-danger)'
    : 'var(--color-text-muted)';

  const btnPad = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';

  return (
    <div className="relative inline-flex" ref={menuRef}>
      {/* ── Botón principal ─────────────────────────────────────────────────── */}
      <button
        onClick={handlePrint}
        disabled={isDisabled}
        className={`inline-flex items-center gap-2 rounded-l-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${btnPad} ${className}`}
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRight: 'none',
          color: 'var(--color-text-primary)',
          ...style,
        }}
        onMouseEnter={e => {
          if (!isDisabled) {
            e.currentTarget.style.borderColor = 'var(--color-accent)';
            e.currentTarget.style.color = 'var(--color-accent)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        title={
          btConnected
            ? `Imprimir en ${btPrinterName ?? 'BT'}`
            : settings.method === 'network'
            ? `Imprimir en ${settings.network?.ip}`
            : 'Imprimir'
        }
      >
        {isPrinting ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Printer className="w-4 h-4" style={{ color: statusColor }} />
        )}
        {!iconOnly && (
          <span>{isPrinting ? 'Imprimiendo...' : label}</span>
        )}
        {/* Indicador de método activo */}
        {!iconOnly && !isPrinting && (
          <span
            className="text-xs opacity-60"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {btConnected ? '●BT' : settings.method === 'network' ? '●WiFi' : ''}
          </span>
        )}
      </button>

      {/* ── Flecha para menú de opciones ─────────────────────────────────────── */}
      <button
        onClick={() => setMenuOpen(v => !v)}
        className={`inline-flex items-center rounded-r-lg font-medium transition-all ${
          size === 'sm' ? 'px-1.5 py-1.5' : 'px-2 py-2'
        }`}
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: '1px solid var(--color-border-subtle)',
          color: 'var(--color-text-muted)',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        title="Opciones de impresión"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Menú desplegable ─────────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="absolute right-0 top-full mt-1 min-w-[260px] rounded-lg shadow-lg z-50 overflow-hidden"
          style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Bluetooth */}
          <div
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            Bluetooth
          </div>

          {bluetoothUnavailableReason ? (
            <div className="px-3 py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {bluetoothUnavailableReason}
            </div>
          ) : btConnected ? (
            <button
              onClick={disconnectBluetooth}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors"
              style={{ color: 'var(--color-danger)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <X className="w-4 h-4 shrink-0" />
              <span>Desconectar {btPrinterName}</span>
            </button>
          ) : (
            <button
              onClick={handleConnectBT}
              disabled={btConnecting}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors disabled:opacity-50"
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {btConnecting ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Bluetooth className="w-4 h-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
              )}
              <div>
                <div style={{ color: 'var(--color-text-primary)' }}>
                  {btConnecting ? 'Conectando...' : 'Conectar impresora BT'}
                </div>
                {settings.lastBTName && (
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Último: {settings.lastBTName}
                  </div>
                )}
              </div>
            </button>
          )}

          {btConnected && (
            <button
              onClick={() => { updateSettings({ method: 'bluetooth' }); handlePrint(); }}
              disabled={isDisabled}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left font-medium transition-colors"
              style={{ color: 'var(--color-success)', borderTop: '1px solid var(--color-border-subtle)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Printer className="w-4 h-4 shrink-0" />
              Imprimir ahora (BT)
            </button>
          )}

          {/* Apps de impresión */}
          <div
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide mt-1"
            style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            Apps de impresión
          </div>

          {escposData && (
            <>
              {[
                { id: 'rawbt' as const, name: 'RawBT', desc: 'Android — más popular' },
                { id: 'sunmi' as const, name: 'Sunmi', desc: 'Dispositivos Sunmi' },
                { id: 'brother' as const, name: 'Brother', desc: 'Brother iPrint&Scan' },
                { id: 'printhand' as const, name: 'PrintHand', desc: 'Android / iOS' },
              ].map(app => (
                <button
                  key={app.id}
                  onClick={() => { openPrinterApp(app.id, escposData); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors"
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Smartphone className="w-4 h-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <div style={{ color: 'var(--color-text-primary)' }}>{app.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{app.desc}</div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Red WiFi */}
          <div
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wide mt-1"
            style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            Red / WiFi
          </div>

          <button
            onClick={() => setConfigOpen(v => !v)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Settings className="w-4 h-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
            <div>
              <div style={{ color: 'var(--color-text-primary)' }}>Configurar IP</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {settings.network?.ip ? `${settings.network.ip}:${settings.network.port ?? 9100}` : 'No configurada'}
              </div>
            </div>
          </button>

          {configOpen && (
            <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
              <div className="pt-2">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  IP de la impresora
                </label>
                <input
                  type="text"
                  value={networkIp}
                  onChange={e => setNetworkIp(e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full mt-1 px-2 py-1.5 text-sm rounded"
                  style={{
                    background: 'var(--color-bg-sunken)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Puerto (default 9100)
                </label>
                <input
                  type="number"
                  value={networkPort}
                  onChange={e => setNetworkPort(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 text-sm rounded"
                  style={{
                    background: 'var(--color-bg-sunken)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
              <button
                onClick={handleSaveNetworkConfig}
                className="w-full py-1.5 rounded text-xs font-medium"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-primary-text)',
                }}
              >
                Guardar y usar WiFi
              </button>
            </div>
          )}

          {/* Fallback browser */}
          {htmlFallback && (
            <>
              <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />
              <button
                onClick={() => {
                  updateSettings({ method: 'browser' });
                  const win = window.open('', '_blank', 'width=420,height=800');
                  if (win) { win.document.write(htmlFallback); win.document.close(); setTimeout(() => win.print(), 300); }
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Printer className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <div style={{ color: 'var(--color-text-primary)' }}>Imprimir (browser)</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Abre diálogo del sistema</div>
                </div>
              </button>
            </>
          )}

          {/* Feedback de error */}
          {lastError && (
            <div
              className="px-3 py-2 text-xs"
              style={{
                background: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                borderTop: '1px solid var(--color-danger)',
              }}
            >
              ✕ {lastError}
            </div>
          )}
        </div>
      )}

      {/* Feedback visual inline */}
      {printFeedback !== 'idle' && (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{
            background: printFeedback === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        />
      )}
    </div>
  );
}
