/* =========================================================
   service-worker.js - PWA offline support & caching
   ========================================================= */

const CACHE_NAME = 'ledger-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './css/dashboard.css',
  './css/responsive.css',
  './js/storage.js',
  './js/transactions.js',
  './js/dashboard.js',
  './js/analytics.js',
  './js/budgets.js',
  './js/goals.js',
  './js/reports.js',
  './js/app.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
];

/* Install event - cache core app shell */
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

/* Activate event - clean up old cache versions */
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/* Fetch event - serve from cache, fall back to network */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Only cache GET requests */
  if (request.method !== 'GET') {
    return;
  }

  /* Skip cross-origin requests (except for CDNs we explicitly cache) */
  if (url.origin !== self.location.origin) {
    if (!request.url.includes('cdn.jsdelivr.net') && !request.url.includes('fonts.googleapis.com')) {
      return;
    }
  }

  /* Network first for API calls and dynamic content */
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
    return;
  }

  /* Cache first for static assets */
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request)
          .then(response => {
            /* Don't cache if not a successful response */
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            /* Clone the response */
            const responseToCache = response.clone();
            /* Cache successful responses for future use */
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            /* Return offline fallback for navigation requests */
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return null;
          });
      })
  );
});

/* Handle messages from clients */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
