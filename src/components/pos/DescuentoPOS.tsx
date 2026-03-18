"use client";

import { useState, useEffect, useCallback } from "react";
import { Percent, DollarSign, AlertCircle, Tag, ShieldCheck } from "lucide-react";
import { ModalEsperaAutorizacion } from "./ModalEsperaAutorizacion";
import type { LimitesDescuento, ItemContextoVenta } from "@/types";

interface DescuentoPOSProps {
  subtotal: number;
  empleadoNombre: string;
  distribuidorId?: string;
  /** Items del carrito para enviar como contexto a la solicitud */
  contextoItems?: ItemContextoVenta[];
  /** Llamado cuando cambia el descuento efectivo */
  onChange: (descuento: number) => void;
}

const LIMITES_FALLBACK: LimitesDescuento = {
  vendedorLibrePct: 5,
  vendedorConRazonPct: 15,
  permiteMontFijo: true,
  montoFijoMaximoSinAprobacion: 500,
};

function fmtMonto(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(n);
}

type Zona = "libre" | "razon" | "autorizar" | "fijo_libre" | "fijo_autorizar";

export function DescuentoPOS({
  subtotal,
  empleadoNombre,
  contextoItems,
  onChange,
}: DescuentoPOSProps) {
  const [limites, setLimites] = useState<LimitesDescuento>(LIMITES_FALLBACK);
  const [tipo, setTipo] = useState<"pct" | "monto">("pct");
  const [valor, setValor] = useState<string>("");
  const [razon, setRazon] = useState("");

  // Estado de autorización pendiente
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [showModalEspera, setShowModalEspera] = useState(false);
  const [descuentoAutorizado, setDescuentoAutorizado] = useState(false);

  // Cargar límites al montar
  useEffect(() => {
    fetch("/api/configuracion/limites-descuento")
      .then((r) => r.json())
      .then((d) => { if (d.success) setLimites(d.data); })
      .catch(() => {});
  }, []);

  // Calcular descuento monetario actual
  const descuentoMonto = useCallback((): number => {
    const v = parseFloat(valor) || 0;
    if (tipo === "pct") {
      return Math.min(subtotal, (v / 100) * subtotal);
    }
    return Math.min(subtotal, v);
  }, [valor, tipo, subtotal]);

  const pctActual = useCallback((): number => {
    const d = descuentoMonto();
    if (subtotal === 0) return 0;
    return (d / subtotal) * 100;
  }, [descuentoMonto, subtotal]);

  // Zona de descuento
  const zona = useCallback((): Zona => {
    const pct = pctActual();
    const monto = descuentoMonto();

    if (tipo === "monto" && limites.permiteMontFijo) {
      if (monto <= limites.montoFijoMaximoSinAprobacion) return "fijo_libre";
      return "fijo_autorizar";
    }

    if (pct <= limites.vendedorLibrePct) return "libre";
    if (pct <= limites.vendedorConRazonPct) return "razon";
    return "autorizar";
  }, [pctActual, descuentoMonto, tipo, limites]);

  // Notificar descuento efectivo al padre
  useEffect(() => {
    const z = zona();
    const esAplicable =
      z === "libre" ||
      z === "fijo_libre" ||
      (z === "razon" && razon.trim().length >= 3) ||
      descuentoAutorizado;

    onChange(esAplicable ? descuentoMonto() : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, tipo, razon, descuentoAutorizado]);

  // Al cambiar subtotal o tipo, resetear
  useEffect(() => {
    setValor("");
    setRazon("");
    setDescuentoAutorizado(false);
    setSolicitudId(null);
    setLinkToken(null);
  }, [subtotal]);

  const handleSolicitarAutorizacion = async () => {
    const monto = descuentoMonto();
    const pct = pctActual();

    try {
      const res = await fetch("/api/autorizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empleadoNombre,
          montoVenta: subtotal,
          montoDescuento: monto,
          porcentajeCalculado: pct,
          esMontFijo: tipo === "monto",
          razon: razon.trim() || undefined,
          contexto: contextoItems
            ? { items: contextoItems, subtotal }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSolicitudId(data.data.id);
      setLinkToken(data.data.linkToken);
      setExpiresAt(new Date(data.data.expiresAt));
      setShowModalEspera(true);
    } catch (err) {
      console.error("Error al solicitar autorización:", err);
    }
  };

  const z = zona();
  const monto = descuentoMonto();
  const pct = pctActual();

  // Colores por zona
  const zonaColor = {
    libre: "var(--color-success)",
    razon: "var(--color-warning)",
    autorizar: "var(--color-danger)",
    fijo_libre: "var(--color-success)",
    fijo_autorizar: "var(--color-danger)",
  }[z];

  const zonaBg = {
    libre: "var(--color-success-bg)",
    razon: "var(--color-warning-bg)",
    autorizar: "var(--color-danger-bg)",
    fijo_libre: "var(--color-success-bg)",
    fijo_autorizar: "var(--color-danger-bg)",
  }[z];

  const zonaTexto = {
    libre: `✓ Libre hasta ${limites.vendedorLibrePct}%`,
    razon: `⚠ Requiere razón (hasta ${limites.vendedorConRazonPct}%)`,
    autorizar: `🔐 Requiere autorización del admin`,
    fijo_libre: `✓ Monto fijo libre (hasta ${fmtMonto(limites.montoFijoMaximoSinAprobacion)})`,
    fijo_autorizar: `🔐 Monto fijo requiere autorización`,
  }[z];

  const tieneValor = (parseFloat(valor) || 0) > 0;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Descuento
          </label>

          {/* Toggle % / $ */}
          <div
            className="flex rounded-lg overflow-hidden text-xs"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <button
              onClick={() => { setTipo("pct"); setValor(""); setDescuentoAutorizado(false); }}
              className="px-3 py-1.5 font-medium transition-colors"
              style={{
                background:
                  tipo === "pct"
                    ? "var(--color-accent)"
                    : "var(--color-bg-sunken)",
                color: tipo === "pct" ? "#fff" : "var(--color-text-muted)",
              }}
            >
              <Percent className="w-3.5 h-3.5 inline mr-1" />
              %
            </button>
            {limites.permiteMontFijo && (
              <button
                onClick={() => { setTipo("monto"); setValor(""); setDescuentoAutorizado(false); }}
                className="px-3 py-1.5 font-medium transition-colors"
                style={{
                  background:
                    tipo === "monto"
                      ? "var(--color-accent)"
                      : "var(--color-bg-sunken)",
                  color:
                    tipo === "monto" ? "#fff" : "var(--color-text-muted)",
                }}
              >
                <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                $
              </button>
            )}
          </div>
        </div>

        {/* Input de valor */}
        <div className="relative">
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            {tipo === "pct" ? "%" : "$"}
          </div>
          <input
            type="number"
            min="0"
            max={tipo === "pct" ? 100 : subtotal}
            step={tipo === "pct" ? "0.5" : "1"}
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              setDescuentoAutorizado(false);
              setSolicitudId(null);
            }}
            placeholder="0"
            className="w-full pl-8 pr-4 py-2 rounded-lg focus:outline-none text-sm"
            style={{
              background: "var(--color-bg-sunken)",
              border: `1px solid ${tieneValor ? zonaColor : "var(--color-border)"}`,
              color: "var(--color-text-primary)",
            }}
          />
          {tieneValor && monto > 0 && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono"
              style={{ color: zonaColor }}
            >
              {tipo === "pct"
                ? fmtMonto(monto)
                : `${pct.toFixed(1)}%`}
            </div>
          )}
        </div>

        {/* Indicador de zona */}
        {tieneValor && monto > 0 && !descuentoAutorizado && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
            style={{ background: zonaBg, color: zonaColor }}
          >
            <Tag className="w-3.5 h-3.5 shrink-0" />
            {zonaTexto}
          </div>
        )}

        {/* Autorizado */}
        {descuentoAutorizado && tieneValor && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
            style={{
              background: "var(--color-success-bg)",
              color: "var(--color-success)",
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            Descuento autorizado por el administrador
          </div>
        )}

        {/* Campo razón (zona amarilla) */}
        {tieneValor && (z === "razon") && !descuentoAutorizado && (
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--color-warning)" }}
            >
              Razón del descuento *
            </label>
            <input
              type="text"
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              placeholder="Ej: Cliente frecuente, precio defectuoso..."
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-warning)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
        )}

        {/* Botón solicitar autorización (zona roja) */}
        {tieneValor &&
          (z === "autorizar" || z === "fijo_autorizar") &&
          !descuentoAutorizado && (
            <button
              onClick={handleSolicitarAutorizacion}
              disabled={!empleadoNombre}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: "var(--color-danger)",
                color: "#fff",
              }}
            >
              <AlertCircle className="w-4 h-4" />
              Solicitar autorización al admin
            </button>
          )}
      </div>

      {/* Modal de espera */}
      {solicitudId && linkToken && expiresAt && (
        <ModalEsperaAutorizacion
          isOpen={showModalEspera}
          solicitudId={solicitudId}
          linkToken={linkToken}
          montoVenta={subtotal}
          montoDescuento={monto}
          porcentaje={pct}
          expiresAt={expiresAt}
          onAprobado={(com) => {
            setDescuentoAutorizado(true);
            setShowModalEspera(false);
            onChange(monto);
            void com;
          }}
          onDeclinado={(com) => {
            setDescuentoAutorizado(false);
            setShowModalEspera(false);
            setValor("");
            onChange(0);
            void com;
          }}
          onExpirado={() => {
            setDescuentoAutorizado(false);
            setShowModalEspera(false);
            setValor("");
            setSolicitudId(null);
            onChange(0);
          }}
          onCancelar={() => {
            setShowModalEspera(false);
            setValor("");
            setSolicitudId(null);
            onChange(0);
          }}
        />
      )}
    </>
  );
}
