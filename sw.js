/**
 * PMP OPS — Minimal service worker for offline shell resilience.
 * Caches app shell only; no data. Scope: production-sane, narrow.
 */
const CACHE_NAME = 'pmp-ops-shell-v1';
const SHELL_URLS = ['/index.html', '/styles.css', '/core.js', '/storage.js', '/render.js', '/stations.js', '/app.js', '/supabase.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html').then((r) => r || caches.match('/'))
      )
    );
    return;
  }
  if (!url.pathname.endsWith('.css') && !url.pathname.endsWith('.js') && url.pathname !== '/index.html') return;
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
