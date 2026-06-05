/* Aurora Sanctuary — service worker
 *
 * Strategy:
 *   - The API (/api) is always network-only; it is never cached, so data is
 *     never stale and POSTs are never intercepted.
 *   - The app shell (HTML/CSS/JS/icons) uses stale-while-revalidate: served
 *     instantly from cache, refreshed in the background. This makes the app
 *     load fast and keep working on flaky shelter wifi.
 */
const CACHE = "aurora-shell-v2";
const SHELL = [
  ".",
  "index.html",
  "app.js",
  "styles.css",
  "vendor-qrcode.js",
  "adopt.html",
  "public.js",
  "manifest.webmanifest",
  "assets/logo.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; /* let API POSTs go straight to network */

  const url = new URL(req.url);
  if (url.pathname.endsWith("/api") || url.pathname.includes("/api?")) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => { if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
