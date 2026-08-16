/* ═══════════════════════════════════════════════════════════
   Service worker.
   Bump VERSION whenever the shell (HTML/CSS/JS) changes — that
   is what makes returning visitors pick up the new build.
   ═══════════════════════════════════════════════════════════ */

const VERSION = "v1";
const CACHE = `portfolio-${VERSION}`;

const SHELL = ["./", "./index.html", "./css/styles.css", "./js/main.js"];
const DATA_SUFFIX = "/data/projects.json";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      // Take over immediately; the page reloads itself on controllerchange.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Serve from cache at once, refresh the copy in the background. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || network;
}

/** Fresh data wins; the cache is only there for offline visits. */
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Fonts etc. use the HTTP cache.

  if (url.pathname.endsWith(DATA_SUFFIX)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      staleWhileRevalidate(request).catch(() => caches.match("./index.html")),
    );
    return;
  }

  const isShell = SHELL.some((path) => url.pathname === new URL(path, self.location).pathname);
  if (isShell) event.respondWith(staleWhileRevalidate(request));
  // Everything else (the older project folders) is left untouched.
});
