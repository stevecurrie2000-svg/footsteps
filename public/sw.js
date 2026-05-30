// public/sw.js
//
// Footsteps Diary — PWA service worker (Phase D, Slice D5).
//
// Makes ONLY /admin/diary open offline and installable. It closes the D4
// reload-offline seam where reloading offline failed to LOAD THE PAGE: now the
// app shell (HTML/JS/CSS) is served from cache while real entry data lives in
// IndexedDB (handled by diary-local.ts / diary-sync.ts).
//
// Strategy:
//   - /api/*           → NETWORK-ONLY. Never cached, never served from cache —
//                        so entry data is never stale and the Cloudflare Access
//                        gate always applies whenever the device is online.
//   - shell + assets   → CACHE-FIRST, falling back to network and populating
//                        the cache on success.
//
// Security posture: offline, the device can't reach Access to prove identity,
// so the SW replays the cached SHELL without a fresh Access check. That is the
// ONLY thing served unauthenticated — non-sensitive HTML/JS/CSS the user had to
// be authenticated to install in the first place. Entries never leave the
// device unauthenticated; they only sync through the Access gate when online.
//
// Cache is versioned — bump CACHE when the shell changes so activate() purges
// the old version rather than serving a stale shell.

const CACHE = "footsteps-diary-v1";

// Stable URLs pre-cached at install. Hashed JS/CSS bundles are NOT enumerated
// here (their names change per build) — they're cached at runtime on first
// load, which happens during this same authenticated online visit.
const PRECACHE_URLS = [
  "/admin/diary",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only intercept same-origin GETs. POST/PUT/DELETE (the sync writes) and any
  // cross-origin request (fonts, etc.) pass straight through to the network.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // NETWORK-ONLY for the API: data is never cached or served stale, and the
  // Access gate always applies when online.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations → serve the cached shell first (ignore the query string so
  // /admin/diary?entry=… still matches), then fall back to the network.
  if (req.mode === "navigate") {
    event.respondWith(
      caches
        .match(req, { ignoreSearch: true })
        .then((hit) => hit || caches.match("/admin/diary"))
        .then((hit) => hit || fetch(req))
    );
    return;
  }

  // Assets (JS/CSS/icons) → cache-first, populate the cache on a clean fetch.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
