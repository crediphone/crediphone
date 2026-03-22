/**
 * Sistema de Iconos CREDIPHONE
 * ─────────────────────────────────────────────────────────────────────────────
 * Todos los iconos siguen el mismo lenguaje visual de Lucide React:
 *   • viewBox 0 0 24 24
 *   • stroke="currentColor" (hereda el color via className o style)
 *   • strokeWidth 2
 *   • strokeLinecap="round" / strokeLinejoin="round"
 *   • fill="none" en trazos, fill en rellenos
 *
 * De esta forma los iconos custom y los de Lucide son indistinguibles:
 * misma densidad óptica, misma "voz" gráfica.
 *
 * Uso:
 *   import { RolIcon, IconScoring, IconWhatsApp } from "@/components/icons";
 *   <RolIcon rol="tecnico" size={20} />
 *   <IconWhatsApp size={18} className="text-green-500" />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Crown,
  Briefcase,
  Wallet2,
  Wrench,
  Globe,
  Building2,
  Users,
  LucideProps,
} from "lucide-react";

// ─── Tipo de rol del sistema ─────────────────────────────────────────────────
export type Rol =
  | "super_admin"
  | "admin"
  | "vendedor"
  | "cobrador"
  | "tecnico";

// ─── Configuración visual por rol ────────────────────────────────────────────
const ROL_CONFIG: Record<
  Rol,
  { Icon: React.ComponentType<LucideProps>; color: string; bg: string; label: string }
> = {
  super_admin: {
    Icon: Globe,
    color: "var(--color-accent)",
    bg: "var(--color-accent-light)",
    label: "Super Admin",
  },
  admin: {
    Icon: Crown,
    color: "var(--color-danger)",
    bg: "var(--color-danger-bg)",
    label: "Admin",
  },
  vendedor: {
    Icon: Briefcase,
    color: "var(--color-success)",
    bg: "var(--color-success-bg)",
    label: "Vendedor",
  },
  cobrador: {
    Icon: Wallet2,
    color: "var(--color-warning)",
    bg: "var(--color-warning-bg)",
    label: "Cobrador",
  },
  tecnico: {
    Icon: Wrench,
    color: "var(--color-accent)",
    bg: "var(--color-accent-light)",
    label: "Técnico",
  },
};

// ─── RolIcon: icono de rol con color semántico ────────────────────────────────
interface RolIconProps {
  rol: Rol | string;
  size?: number;
  /** Si true, envuelve el icono en un círculo con fondo del color del rol */
  badge?: boolean;
  className?: string;
}

export function RolIcon({ rol, size = 16, badge = false, className }: RolIconProps) {
  const config = ROL_CONFIG[rol as Rol];
  if (!config) {
    return <Users size={size} style={{ color: "var(--color-text-muted)" }} className={className} />;
  }

  const { Icon, color, bg } = config;

  if (badge) {
    return (
      <span
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size + 10,
          height: size + 10,
          borderRadius: "50%",
          background: bg,
          flexShrink: 0,
        }}
      >
        <Icon size={size} style={{ color }} strokeWidth={2} />
      </span>
    );
  }

  return (
    <Icon
      size={size}
      style={{ color }}
      strokeWidth={2}
      className={className}
    />
  );
}

// ─── RolLabel: texto del rol en español ──────────────────────────────────────
export function rolLabel(rol: string): string {
  return ROL_CONFIG[rol as Rol]?.label ?? rol;
}

// ─── Propiedades SVG compartidas (idénticas a Lucide) ────────────────────────
interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}

const defaults = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  stroke: "currentColor",
};

// ─── IconScoring: estrella de puntuación crediticia ──────────────────────────
// (Lucide tiene Star pero sin "barra de progreso" interna — versión semántica)
export function IconScoring({ size = 24, className, style, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="Scoring crediticio"
      {...defaults}
      strokeWidth={strokeWidth}
    >
      {/* Estrella */}
      <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.2L12 14l-4.8 2.5.9-5.2L4.3 7.6l5.3-.8z" />
      {/* Barra de progreso en la base */}
      <line x1="5" y1="21" x2="19" y2="21" strokeWidth={strokeWidth * 0.7} />
      <line x1="5" y1="21" x2="13" y2="21" strokeWidth={strokeWidth} />
    </svg>
  );
}

// ─── IconWhatsApp: marca WhatsApp como SVG trazado (sin fill) ────────────────
// Sigue las mismas proporciones ópticas que Lucide: limpio, stroke-only.
export function IconWhatsApp({ size = 24, className, style, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="WhatsApp"
      {...defaults}
      strokeWidth={strokeWidth}
    >
      {/* Burbuja de mensaje redondeada */}
      <path d="M12 3a9 9 0 0 1 7.8 13.5L21 21l-4.5-1.2A9 9 0 1 1 12 3z" />
      {/* Teléfono dentro — señal de llamada */}
      <path
        d="M9 9c0-.5.4-1 1-1h.5c.3 0 .5.2.6.4l.7 1.7c.1.2 0 .5-.2.7l-.5.5a5 5 0 0 0 2.5 2.5l.5-.5c.2-.2.5-.3.7-.2l1.7.7c.3.1.5.3.5.6V15c0 .6-.5 1-1 1A7 7 0 0 1 9 9z"
        strokeWidth={strokeWidth * 0.85}
      />
    </svg>
  );
}

// ─── IconImei: código IMEI / serial ──────────────────────────────────────────
export function IconImei({ size = 24, className, style, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="IMEI / Número de serie"
      {...defaults}
      strokeWidth={strokeWidth}
    >
      {/* Chip */}
      <rect x="7" y="7" width="10" height="10" rx="2" />
      {/* Pines del chip */}
      <line x1="9" y1="7" x2="9" y2="4" />
      <line x1="12" y1="7" x2="12" y2="4" />
      <line x1="15" y1="7" x2="15" y2="4" />
      <line x1="9" y1="17" x2="9" y2="20" />
      <line x1="12" y1="17" x2="12" y2="20" />
      <line x1="15" y1="17" x2="15" y2="20" />
      <line x1="7" y1="9" x2="4" y2="9" />
      <line x1="7" y1="12" x2="4" y2="12" />
      <line x1="7" y1="15" x2="4" y2="15" />
      <line x1="17" y1="9" x2="20" y2="9" />
      <line x1="17" y1="12" x2="20" y2="12" />
      <line x1="17" y1="15" x2="20" y2="15" />
      {/* Punto central */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ─── IconPayjoy: logo Payjoy simplificado ────────────────────────────────────
export function IconPayjoy({ size = 24, className, style, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="Payjoy"
      {...defaults}
      strokeWidth={strokeWidth}
    >
      {/* Teléfono bloqueado — concepto de financiamiento */}
      <rect x="7" y="2" width="10" height="16" rx="2" />
      <line x1="7" y1="15" x2="17" y2="15" />
      {/* Candado en la parte baja */}
      <rect x="9.5" y="17" width="5" height="4" rx="1" />
      <path d="M10.5 17v-1.5a1.5 1.5 0 0 1 3 0V17" />
    </svg>
  );
}

// ─── IconRemision: folio de remisión / guía ──────────────────────────────────
export function IconRemision({ size = 24, className, style, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="Remisión / Folio"
      {...defaults}
      strokeWidth={strokeWidth}
    >
      {/* Documento */}
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      {/* Líneas de contenido */}
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
      {/* Número / código */}
      <line x1="8" y1="10" x2="10" y2="10" strokeWidth={strokeWidth * 1.3} />
    </svg>
  );
}

// ─── IconCajaAbierta: caja registradora con turno activo ─────────────────────
export function IconCajaAbierta({ size = 24, className, style, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="Caja abierta"
      {...defaults}
      strokeWidth={strokeWidth}
    >
      {/* Cuerpo de la caja */}
      <rect x="2" y="10" width="20" height="11" rx="2" />
      {/* Frente de la caja */}
      <path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
      {/* Cajón */}
      <rect x="9" y="14" width="6" height="4" rx="1" />
      {/* Teclas */}
      <circle cx="6" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="18" cy="18" r="1" fill="currentColor" stroke="none" />
      {/* Punto de activo (arriba) */}
      <circle cx="12" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ─── IconDistribuidor: edificio con señal ────────────────────────────────────
export function IconDistribuidor({ size = 24, className, style, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="Distribuidor / Sucursal"
      {...defaults}
      strokeWidth={strokeWidth}
    >
      {/* Edificio */}
      <rect x="3" y="9" width="13" height="13" />
      <path d="M3 9l6.5-6 6.5 6" />
      {/* Ventanas */}
      <rect x="6" y="12" width="3" height="3" />
      <rect x="10" y="12" width="3" height="3" />
      <rect x="6" y="17" width="3" height="5" />
      {/* Señal wifi en la esquina — es una distribuidora */}
      <path d="M18 8a4 4 0 0 1 0 6" />
      <path d="M20 5a7 7 0 0 1 0 12" />
      <circle cx="18" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ─── Exportar todos los iconos juntos ────────────────────────────────────────
export {
  // Lucide icons re-exportados para uso único vía este módulo (opcional)
  Crown,
  Briefcase,
  Wallet2,
  Wrench,
  Globe,
  Building2,
  Users,
};
