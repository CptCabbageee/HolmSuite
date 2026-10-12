// Service worker: offline shell + web push. Kept deliberately small and hand-written.
// Every path is relative to this file, so the app works at any address (e.g. holmsuite.com/musicroom/).
// Several venues share holmsuite.com, and so share one set of caches: each venue's cache is named after
// its folder, and a venue only ever clears its own older caches (plus the old unnamed ones).
const SCOPE = new URL(self.registration.scope).pathname;
const CACHE = `bar-shell-v6:${SCOPE}`;
const mine = (k) => k.endsWith(`:${SCOPE}`) || /^bar-shell-v\d+$/.test(k);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && mine(k)).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Works with no signal (a basement bar, patchy 4G), so a customer can still show their QR code
// (Megathon 7, 2026-10-12). Page loads: network first, so a new deploy shows up, and the fresh page is kept
// for next time; cache when offline. The app's own files (assets/, hashed so they never change): cache
// first, saved the first time they load. Everything else (the database, fonts) goes to the network as normal.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); }
      return res;
    }).catch(() => caches.match('./')));
    return;
  }
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.includes('/assets/')) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});

self.addEventListener('push', (e) => {
  let data = { title: 'New event', body: '', url: './' }; // the server always sends a title (venue: act)
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
