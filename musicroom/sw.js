// Service worker: offline shell + web push. Kept deliberately small and hand-written.
// Every path is relative to this file, so the app works at any address (e.g. holmsuite.com/musicroom/).
const CACHE = 'bar-shell-v4';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Network-first for page loads (so a new deploy shows up), cache fallback when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => caches.match('./')));
});

self.addEventListener('push', (e) => {
  let data = { title: 'The Music Room', body: '', url: './' };
  try { data = { ...data, ...e.data.json() }; } catch {}
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: 'icon-192.png', badge: 'icon-192.png', data: { url: data.url } }));
});

// The browser replaced this phone's push subscription (it expired or was rotated). Apple doesn't always
// tell the server with a 410 (https://bugs.webkit.org/show_bug.cgi?id=249766), so make the new one here,
// with the same key. The service worker isn't signed in, so it can't save it to the server; the app does
// that the next time the Gigs screen opens (syncPush in push.ts).
self.addEventListener('pushsubscriptionchange', (e) => {
  const options = e.oldSubscription?.options;
  if (!options?.applicationServerKey) return;
  e.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: options.applicationServerKey }).catch(() => {}));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
