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
    const net = fetch(req);
    const saved = net.then((res) => res.ok && saveShell(res.clone())).catch(() => {});
    // Weak signal (a connection that never answers) gets no automatic time-out inside a service worker, so
    // after 4 seconds show the saved copy if there is one; the network load carries on and refreshes the
    // cache for next time. No saved copy: keep waiting for the network. Lie-fi pattern:
    // https://developer.chrome.com/docs/workbox/forcing-a-network-timeout, https://adactio.com/journal/15122
    const slow = new Promise((resolve) => setTimeout(() => caches.match('./').then((hit) => hit && resolve(hit)), 4000));
    e.respondWith(Promise.race([net, slow]).catch(() => caches.match('./')));
    e.waitUntil(saved);
    return;
  }
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.includes('/assets/')) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});

// Save a fresh page only once the hashed files it names are saved too. On weak signal the old saved page
// is shown after 4 seconds while the new one finishes downloading in the background; if the new page
// replaced the saved copy straight away, a later visit with no signal would open a page whose new
// assets/ files were never fetched, and the QR card wouldn't show (Megathon 15 dream cycle 69).
async function saveShell(res) {
  const html = await res.clone().text();
  const assets = [...new Set([...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)].map((m) => new URL(m[1], self.registration.scope).href))];
  const c = await caches.open(CACHE);
  await Promise.all(assets.map((a) => c.match(a).then((hit) => hit || fetch(a).then((r) => { if (!r.ok) throw new Error(a); return c.put(a, r); }))));
  await c.put('./', res);
}

self.addEventListener('push', (e) => {
  let data = { title: 'New event', body: '', url: './' }; // the server always sends a title (venue: act)
  try { data = { ...data, ...e.data.json() }; } catch {}
  // No `badge`: Android draws the badge from its alpha channel only, and icon-192.png is fully opaque, so it
  // showed as a plain white square in the status bar. Without one, Chrome shows its own icon (Megathon 17
  // dream cycle 88). A real badge needs a transparent one-colour silhouette.
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: 'icon-192.png', data: { url: data.url } }));
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
