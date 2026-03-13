/**
 * FASE 28: Servicio interno de Web Push
 * Usado por: /api/push/send + notificaciones-reparaciones.ts (trigger)
 */

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Configurar VAPID una sola vez al importar el módulo
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@crediphone.mx";
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/**
 * Envía notificación push a TODOS los dispositivos suscritos de un usuario.
 * Elimina suscripciones expiradas (respuesta 410 de los servidores push).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return; // Sin VAPID keys = modo silencioso

  const supabase = createAdminClient();

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  const expiradas: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
        // Actualizar last_used_at
        await supabase
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", sub.id);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiradas.push(sub.id);
        }
      }
    })
  );

  // Limpiar suscripciones expiradas
  if (expiradas.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiradas);
  }
}

/**
 * Envía push a múltiples usuarios (p. ej. todos los admins de un distribuidor).
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
}
