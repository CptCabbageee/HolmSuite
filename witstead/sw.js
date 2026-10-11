// Witstead web: a deliberately tiny service worker. It exists so browsers treat the site as an
// installable app ("Add to home screen" / Install), and it keeps the last page shell so the app
// still opens offline. Paths are relative to this file, so it works at holmsuite.com/witstead/.
const CACHE = 'witstead-shell-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Network-first for page loads, so a new deploy always shows up; the cached shell only when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => caches.match('./')));
});
