/**
 * Cicatrix Service Worker — Safari-safe edition
 *
 * HIPAA note: only static app files are ever cached here.
 * No patient data, wound data, or session content is cached.
 */

const CACHE_NAME = "cicatrix-shell-v11";
const SHELL_URLS = ["/index.html", "/app.js", "/styles.css"];

/* ── Install: pre-cache app shell ───────────────────────────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) /* don't block install if pre-cache fails */
  );
});

/* ── Activate: remove stale caches ─────────────────────────────────────── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: only intercept same-origin GET requests ─────────────────────── */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  /* Only handle GET — let POST/PUT/DELETE pass through untouched */
  if (req.method !== "GET") return;

  /* Only handle same-origin requests */
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* Never cache the audit endpoint */
  if (url.pathname === "/audit") return;

  /* ── Navigation (HTML pages): network-first, cache fallback ── */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((response) => {
          /* Update cache with fresh copy */
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return response;
        })
        .catch(() =>
          /* Offline: serve cached index.html if available */
          caches.match("/index.html").then((cached) => {
            if (cached) return cached;
            /* Nothing cached yet — return a proper error response */
            return new Response("Offline — please reload when connected.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            });
          })
        )
    );
    return;
  }

  /* ── Static assets (JS, CSS): cache-first, network fallback ── */
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return response;
      });
    })
  );
});
