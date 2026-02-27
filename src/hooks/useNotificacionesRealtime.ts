"use client";

/**
 * CREDIPHONE — Hook de Notificaciones en Tiempo Real (FASE 28)
 *
 * Suscribe a Supabase Realtime en la tabla `notificaciones` filtrado
 * por el usuario actual. Cuando llega una nueva notificación:
 *   1. Reproduce el sonido configurado para ese tipo de evento
 *   2. Despacha el evento DOM "nueva-notificacion" para que
 *      CampanaNotificaciones actualice su badge sin esperar el polling
 *
 * Uso: llamar una sola vez en DashboardShellInner
 */

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  reproducirSonido,
  reproducirSonidoCustom,
  reproducirSonidoUrgente,
  sonidoParaEvento,
  type SoundId,
} from "@/lib/sounds";

interface SonidosConfig {
  habilitado?: boolean;
  volumen?: number;
  sonidoDefault?: SoundId;
  mapeoEventos?: Record<string, SoundId>;
  sonidoCustomUrl?: string | null;
}

interface UseNotificacionesRealtimeProps {
  userId: string | null | undefined;
  sonidosConfig?: SonidosConfig | null;
}

export function useNotificacionesRealtime({
  userId,
  sonidosConfig,
}: UseNotificacionesRealtimeProps) {
  // Mantener ref actualizada para evitar stale closures
  const configRef = useRef(sonidosConfig);
  useEffect(() => {
    configRef.current = sonidosConfig;
  }, [sonidosConfig]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const canalNombre = `notificaciones-usuario-${userId}`;

    const canal = supabase
      .channel(canalNombre)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificaciones",
          filter: `destinatario_id=eq.${userId}`,
        },
        (payload) => {
          const cfg = configRef.current;
          const habilitado = cfg?.habilitado ?? true;
          if (!habilitado) return;

          const volumen = cfg?.volumen ?? 0.7;
          const tipo: string = payload.new?.tipo ?? "";
          const esUrgente =
            payload.new?.prioridad === "urgente" ||
            payload.new?.prioridad === "alta";

          // Reproducir sonido
          if (esUrgente) {
            reproducirSonidoUrgente(volumen).catch(() => {});
          } else if (cfg?.sonidoCustomUrl) {
            reproducirSonidoCustom(cfg.sonidoCustomUrl, volumen).catch(() => {
              // Si falla el custom, usar el preset
              const id = sonidoParaEvento(tipo, cfg?.mapeoEventos);
              reproducirSonido(id, volumen).catch(() => {});
            });
          } else {
            const id = sonidoParaEvento(tipo, cfg?.mapeoEventos);
            reproducirSonido(id, volumen).catch(() => {});
          }

          // Notificar a CampanaNotificaciones para que refresque el badge
          window.dispatchEvent(new CustomEvent("nueva-notificacion", {
            detail: { tipo, payload: payload.new },
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [userId]);
}
