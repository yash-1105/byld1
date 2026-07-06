/* BYLD service worker — minimal, install-enabling.
   Network-first for everything; caches the app shell + static assets as a
   fallback so a previously visited app can still open offline. Supabase and
   other cross-origin API calls are never cached. */
const CACHE = 'byld-v2';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/pwa-192.png', '/pwa-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // never intercept cross-origin (Supabase, Google APIs, …)
  if (url.origin !== self.location.origin) return;

  // Never intercept video/range requests. The landing page's scroll-scrubbed
  // <video> elements fire a steady stream of byte-range fetches while
  // seeking; proxying each one through the SW (and attempting to cache 206
  // Partial Content responses) adds latency and can stall/garble playback —
  // this is what caused videos to glitch and fail to load in the installed
  // PWA specifically. Returning without respondWith() lets the browser
  // handle these natively, exactly as if no SW were registered.
  if (request.headers.has('range') || /\.(mp4|webm|mov|m4v)$/i.test(url.pathname)) return;

  // SPA navigations: network first, fall back to cached shell when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // static assets: network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && (url.pathname.startsWith('/assets/') || SHELL.includes(url.pathname))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
