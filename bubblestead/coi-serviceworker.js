// Adds the two "cross-origin isolation" headers to every response for holmsuite.com/bubblestead/, which
// GitHub Pages can't send itself (github.com/orgs/community/discussions/13309). Without them the
// browser withholds SharedArrayBuffer and Bubblestead's browser database (expo-sqlite) can't start.
// Registered by public/index.html. Same idea as the coi-serviceworker project, written here so nothing
// third-party runs on holmsuite.com.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return
  e.respondWith(
    fetch(req).then((res) => {
      // An opaque cross-origin response can't be changed; pass it through.
      if (res.status === 0) return res
      const headers = new Headers(res.headers)
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
      headers.set('Cross-Origin-Opener-Policy', 'same-origin')
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
    })
  )
})
