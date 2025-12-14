const CACHE_VERSION = 'v2';
const STATIC_CACHE = `gastos-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gastos-runtime-${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/iconoMobile1.png',
  '/iconoMobile2.png',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1) Navigation requests: fallback to index.html (offline-friendly SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => res)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 2) Avoid caching calls to analytics or external domains if you want
  // (Optional: keep it simple; only cache same-origin)
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) {
    // Let the network handle third-party requests
    return;
  }

  // 3) If you use Firebase/Firestore REST calls through your app origin, treat as network-first.
  // If you're calling googleapis domains directly, those are not same-origin and will skip caching above.
  const isApiCall =
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/__/') ||
    url.pathname.includes('firestore') ||
    url.pathname.includes('googleapis');

  if (isApiCall) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 4) Static assets: stale-while-revalidate
  const isStaticAsset =
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font';

  if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 5) Default: cache-first fallback
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const res = await fetch(request);
  const cache = await caches.open(RUNTIME_CACHE);
  cache.put(request, res.clone());
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(request);
    cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((res) => {
      cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || fetch(request);
}
