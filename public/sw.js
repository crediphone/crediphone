/**
 * CREDIPHONE — Service Worker (FASE 28)
 *
 * Responsabilidades:
 *   1. Push notifications nativas (Web Push API)
 *   2. Cache estratégico para soporte offline
 *      - /_next/static/ → Cache First
 *      - /api/          → Network First (sin fallback)
 *      - Páginas        → Network First con fallback a /offline.html
 */

const CACHE_VERSION = "crediphone-v1";
const OFFLINE_PAGE  = "/offline.html";

// Páginas a pre-cachear en install
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/dashboard",
];

// ── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {
        // Si alguna URL falla (ej: no existe aún), continuar igual
      })
    )
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar requests del mismo origen
  if (url.origin !== self.location.origin) return;

  // Assets estáticos de Next.js → Cache First
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // API calls → Network First, sin fallback de caché
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Páginas → Network First con fallback offline
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }
});

// ── Estrategias ───────────────────────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Sin conexión" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    // Actualizar caché con la respuesta más reciente
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Sin red: intentar desde caché
    const cached = await caches.match(request);
    if (cached) return cached;
    // Último recurso: página offline
    return caches.match(OFFLINE_PAGE);
  }
}

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "CREDIPHONE",
      body: event.data.text(),
      url: "/dashboard",
    };
  }

  const options = {
    body: data.body ?? "",
    icon: data.icon ?? "/icon-192.png",
    badge: "/icon-72.png",
    data: { url: data.url ?? "/dashboard" },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    tag: "crediphone-notif",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "CREDIPHONE", options)
  );
});

// ── Notification Click ────────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Si ya hay una ventana abierta con la URL, enfocarla
        for (const client of windowClients) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // Si no, abrir nueva ventana
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
