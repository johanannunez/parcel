// Parcel PWA Service Worker
// Caching strategy: shell = stale-while-revalidate, static = cache-first, data = network-only

const CACHE_NAME = "parcel-v1";
const OFFLINE_URL = "/offline";

// Pre-cache on install
const PRE_CACHE = [
  OFFLINE_URL,
  "/brand/logo-mark.png",
  "/brand/logo-mark-white.png",
  "/brand/app-icon-light-192.png",
];

// Install: pre-cache essentials
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean old caches, take control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: route requests through caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip Supabase, API, and auth requests (always network)
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.hostname.includes("supabase")
  ) {
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2|ttf|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests (HTML pages): stale-while-revalidate with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            // Network failed: serve offline page
            return caches.match(OFFLINE_URL);
          });

        // Return cached version immediately if available, otherwise wait for network
        return cached || fetchPromise;
      })
    );
    return;
  }
});

// Push notification received
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Parcel", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Parcel", {
      body: payload.body || "",
      icon: "/brand/app-icon-light-192.png",
      badge: "/brand/favicon-32.png",
      data: payload.data || { url: "/portal/messages" },
      tag: payload.tag || "parcel-message",
      renotify: true,
    })
  );
});

// Notification clicked: open the portal
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/portal/messages";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing portal tab if open
        for (const client of clients) {
          if (client.url.includes("/portal") && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(targetUrl);
      })
  );
});
