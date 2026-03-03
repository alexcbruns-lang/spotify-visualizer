// VIZarcade Service Worker — v1
// Cache-first for static assets, network-first for API/Firebase

const CACHE_NAME = 'vizarcade-v4';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js'
];

// These patterns always go network-first (live data, auth, APIs)
const NETWORK_FIRST_PATTERNS = [
  'firebaseio.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
  'accounts.spotify.com',
  'api.spotify.com',
  '/api/',
  'api.anthropic.com',
  'acrcloud.com'
];

// ── Install: pre-cache static shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use allSettled so one failed asset doesn't break the install
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => {
            console.warn('[sw] failed to cache:', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: route by strategy ──
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Network-first for live data (Firebase, Spotify, APIs)
  if (NETWORK_FIRST_PATTERNS.some(p => url.includes(p))) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else (HTML, fonts, libraries, icons)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GETs for future offline use
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
