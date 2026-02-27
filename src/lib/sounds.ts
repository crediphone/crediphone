/**
 * CREDIPHONE — Motor de Sonidos de Notificación (FASE 28)
 *
 * Genera sonidos de notificación usando Web Audio API.
 * NO requiere archivos externos — todos los sonidos se sintetizan en código.
 * Compatible con cualquier navegador moderno.
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export type SoundId =
  | "cristal"
  | "doble_ding"
  | "arpegio"
  | "marimba"
  | "pop"
  | "pulso";

export interface SoundPreset {
  nombre: string;
  descripcion: string;
  emoji: string;
}

// ── Catálogo de presets ───────────────────────────────────────────────────────

export const SONIDOS_PRESET: Record<SoundId, SoundPreset> = {
  cristal: {
    nombre: "Cristal suave",
    descripcion: "Una nota cristalina corta y elegante. La menos intrusiva.",
    emoji: "🔔",
  },
  doble_ding: {
    nombre: "Doble ding",
    descripcion: "Dos notas ascendentes, como timbre de hotel. Claro y discreto.",
    emoji: "🎵",
  },
  arpegio: {
    nombre: "Arpegio 3 notas",
    descripcion: "Tres notas ascendentes tipo marimba. Alegre sin ser molesto.",
    emoji: "🎶",
  },
  marimba: {
    nombre: "Marimba cálida",
    descripcion: "Tono cálido de percusión, suave y agradable.",
    emoji: "🥁",
  },
  pop: {
    nombre: "Pop suave",
    descripcion: "Un pop corto y nítido, como Slack. Muy sutil.",
    emoji: "💬",
  },
  pulso: {
    nombre: "Pulso gentil",
    descripcion: "Barrido ascendente de tono, suave y relajado.",
    emoji: "〰️",
  },
};

// ── Mapeo evento → sonido ─────────────────────────────────────────────────────

const MAPEO_DEFAULT: Record<string, SoundId> = {
  cliente_aprobo: "arpegio",
  cliente_rechazo: "pulso",
  nueva_orden: "doble_ding",
  presupuesto_pendiente: "cristal",
  urgente: "pop",
};

/**
 * Devuelve el SoundId apropiado para un tipo de notificación.
 * Acepta un mapeo personalizado (de la configuración del distribuidor).
 */
export function sonidoParaEvento(
  tipoNotificacion: string,
  mapeoConfig?: Record<string, SoundId>
): SoundId {
  const mapeo = mapeoConfig ?? MAPEO_DEFAULT;
  return mapeo[tipoNotificacion] ?? "cristal";
}

// ── Contexto de audio (singleton lazy) ───────────────────────────────────────

let _ctx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    try {
      _ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // Reanudar si fue suspendido por política del navegador
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

// ── Utilidades de síntesis ────────────────────────────────────────────────────

type OscType = OscillatorType;

function tonarNota(
  ctx: AudioContext,
  frecuencia: number,
  inicioSeg: number,
  duracionSeg: number,
  volumen: number,
  tipo: OscType = "sine"
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, inicioSeg);

  // Envelope: attack suave → decay exponencial
  gain.gain.setValueAtTime(0, inicioSeg);
  gain.gain.linearRampToValueAtTime(volumen, inicioSeg + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, inicioSeg + duracionSeg);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(inicioSeg);
  osc.stop(inicioSeg + duracionSeg + 0.05);
}

function barrido(
  ctx: AudioContext,
  freqInicio: number,
  freqFin: number,
  inicioSeg: number,
  duracionSeg: number,
  volumen: number,
  tipo: OscType = "sine"
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = tipo;
  osc.frequency.setValueAtTime(freqInicio, inicioSeg);
  osc.frequency.linearRampToValueAtTime(freqFin, inicioSeg + duracionSeg);

  gain.gain.setValueAtTime(0, inicioSeg);
  gain.gain.linearRampToValueAtTime(volumen, inicioSeg + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, inicioSeg + duracionSeg);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(inicioSeg);
  osc.stop(inicioSeg + duracionSeg + 0.05);
}

// ── Sintetizadores por preset ─────────────────────────────────────────────────

const SINTETIZADORES: Record<SoundId, (ctx: AudioContext, vol: number) => void> = {
  /** Cristal: nota E5 limpia con decay largo */
  cristal(ctx, vol) {
    const t = ctx.currentTime;
    tonarNota(ctx, 659.25, t, 0.9, vol * 0.6, "sine");
  },

  /** Doble ding: C5 → E5, separadas 160ms */
  doble_ding(ctx, vol) {
    const t = ctx.currentTime;
    tonarNota(ctx, 523.25, t, 0.35, vol * 0.55, "sine");
    tonarNota(ctx, 659.25, t + 0.16, 0.5, vol * 0.55, "sine");
  },

  /** Arpegio 3 notas: C5 → E5 → G5 */
  arpegio(ctx, vol) {
    const t = ctx.currentTime;
    tonarNota(ctx, 523.25, t,        0.3,  vol * 0.5, "sine");
    tonarNota(ctx, 659.25, t + 0.13, 0.3,  vol * 0.5, "sine");
    tonarNota(ctx, 783.99, t + 0.26, 0.55, vol * 0.5, "sine");
  },

  /** Marimba: triangle C4 → G4 → C5, tono más cálido */
  marimba(ctx, vol) {
    const t = ctx.currentTime;
    tonarNota(ctx, 261.63, t,        0.4,  vol * 0.45, "triangle");
    tonarNota(ctx, 392.00, t + 0.18, 0.4,  vol * 0.45, "triangle");
    tonarNota(ctx, 523.25, t + 0.36, 0.6,  vol * 0.45, "triangle");
  },

  /** Pop: barrido corto 200→600 Hz, muy sutil */
  pop(ctx, vol) {
    const t = ctx.currentTime;
    barrido(ctx, 200, 600, t, 0.1, vol * 0.45, "sine");
  },

  /** Pulso: barrido suave ascendente 200→800 Hz */
  pulso(ctx, vol) {
    const t = ctx.currentTime;
    barrido(ctx, 200, 800, t, 0.4, vol * 0.4, "sine");
  },
};

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Reproduce un sonido preset.
 * @param id      Identificador del sonido
 * @param volumen Volumen de 0 a 1 (default 0.7)
 */
export async function reproducirSonido(
  id: SoundId,
  volumen = 0.7
): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  await ctx.resume();
  const fn = SINTETIZADORES[id];
  if (fn) fn(ctx, Math.max(0, Math.min(1, volumen)));
}

/**
 * Reproduce un sonido custom desde una URL (archivo MP3/OGG subido por el usuario).
 * @param url     URL del archivo de sonido
 * @param volumen Volumen de 0 a 1 (default 0.7)
 */
export async function reproducirSonidoCustom(
  url: string,
  volumen = 0.7
): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    await ctx.resume();
    const resp = await fetch(url);
    const buf = await resp.arrayBuffer();
    const decoded = await ctx.decodeAudioData(buf);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(1, volumen));
    source.buffer = decoded;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (err) {
    console.warn("[sounds] Error al reproducir sonido custom:", err);
  }
}

/**
 * Reproduce el sonido urgente (3 pops rápidos).
 */
export async function reproducirSonidoUrgente(volumen = 0.7): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  await ctx.resume();
  const v = Math.max(0, Math.min(1, volumen));
  barrido(ctx, 200, 600, ctx.currentTime,        0.08, v * 0.5, "sine");
  barrido(ctx, 200, 600, ctx.currentTime + 0.12, 0.08, v * 0.5, "sine");
  barrido(ctx, 200, 600, ctx.currentTime + 0.24, 0.08, v * 0.5, "sine");
}
