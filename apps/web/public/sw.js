// Parcel PWA Service Worker
// Strategy: network-first for HTML, hands-off for Next.js chunks,
// cache-first for brand assets only.

const CACHE_NAME = "parcel-v3";
const OFFLINE_URL = "/offline";

// Pre-cache brand assets that rarely change
const PRE_CACHE = [
  OFFLINE_URL,
  "/brand/logo-mark.png",
  "/brand/logo-mark-white.png",
  "/brand/app-icon-light-192.png",
];

// Install: pre-cache essentials and take over immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRE_CACHE))
      .catch(() => {
        // Fail open: if pre-cache fails, install still succeeds
      }),
  );
  self.skipWaiting();
});

// Allow the page to force activation on a new SW
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Activate: clean ALL old caches, take control of existing clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

// Fetch: route requests through caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET from our own origin
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // NEVER intercept Next.js chunks, API routes, auth, or service worker itself.
  // Next.js hashes its chunks and sets long-lived cache headers. Letting the
  // browser HTTP cache handle them avoids ChunkLoadError after deploys.
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname === "/sw.js"
  ) {
    return;
  }

  // Brand assets: cache-first (these rarely change)
  if (url.pathname.startsWith("/brand/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
      }),
    );
    return;
  }

  // HTML navigation: network-first with offline fallback
  // This ensures users always get fresh HTML (with fresh chunk references)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful navigations
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Network failed: try cache, then offline page
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  // Everything else: pass through to network (no SW caching)
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
    }),
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
        for (const client of clients) {
          if (client.url.includes("/portal") && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
