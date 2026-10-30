// Adds the two "cross-origin isolation" headers to every response for holmsuite.com/bubblestead/, which
// GitHub Pages can't send itself (github.com/orgs/community/discussions/13309). Without them the
// browser withholds SharedArrayBuffer and Bubblestead's browser database (expo-sqlite) can't start.
// Registered by public/index.html. Same idea as the coi-serviceworker project, written here so nothing
// third-party runs on holmsuite.com.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

const withIsolation = (res) => {
  const headers = new Headers(res.headers)
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return
  // A plain picture from another site (an <img>: Supabase storage for avatars, Wikimedia for bubble
  // pictures) is fetched "no-cors", and an isolated page blocks those unless the site sends a
  // Cross-Origin-Resource-Policy header, which Supabase storage doesn't. So the avatar's picture never
  // loaded and the app fell back to a stock avatar (George, 2026-10-30, after "Design" on the profile).
  // Fetch it readably instead (both sites allow that: Access-Control-Allow-Origin: *), so the header can
  // be added; if a site doesn't allow it, fall back to the plain fetch.
  if (req.mode === 'no-cors' && new URL(req.url).origin !== self.location.origin) {
    e.respondWith(
      fetch(new Request(req.url, { mode: 'cors', credentials: 'omit' }))
        .then(withIsolation)
        .catch(() => fetch(req))
    )
    return
  }
  e.respondWith(
    fetch(req).then((res) => (res.status === 0 ? res : withIsolation(res)))
  )
})
