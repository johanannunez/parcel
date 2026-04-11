// Self-destructing service worker.
//
// We intentionally DO NOT ship a PWA right now. The previous
// service worker cached Next.js chunks cache-first, which caused
// ChunkLoadError on every deploy. This file exists solely to
// replace the broken SW for clients that still have it installed.
//
// When the browser checks for SW updates, it byte-compares /sw.js.
// Finding this new version, it installs, activates, wipes all
// caches, and unregisters itself. The client is clean on the
// next navigation.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Wipe every cache this SW (or any earlier version) ever made
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        // no-op
      }

      try {
        // Take control of existing clients so we can redirect them
        await self.clients.claim();
      } catch {
        // no-op
      }

      try {
        // Unregister ourselves so no SW remains
        await self.registration.unregister();
      } catch {
        // no-op
      }

      try {
        // Force all existing clients to reload onto a clean page
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
          // Use navigate so in-memory state is discarded
          if ("navigate" in client) {
            client.navigate(client.url);
          }
        }
      } catch {
        // no-op
      }
    })(),
  );
});

// Pass all fetches through to the network without any caching,
// so the window of time before the new SW activates is still safe.
self.addEventListener("fetch", () => {
  // Intentionally do not call event.respondWith() — let the browser
  // handle the request normally (no SW interception).
});
