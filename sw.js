const CACHE_NAME = 'nexus-cache-v2'; // Bumped version for update
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/index.tsx',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];
const CDN_URLS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap',
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0',
  'https://esm.sh/react-dom@18.2.0/client',
  'https://esm.sh/@google/genai@^1.13.0'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache for PWA assets');
      const appShellPromise = cache.addAll(APP_SHELL_URLS);
      const cdnPromise = Promise.all(
        CDN_URLS.map(url => 
            fetch(new Request(url, { mode: 'no-cors' }))
              .then(response => cache.put(url, response))
              .catch(err => console.warn(`Failed to cache CDN URL: ${url}`, err))
        )
      );
      return Promise.all([appShellPromise, cdnPromise]);
    }).catch(err => {
        console.error("Cache addAll failed:", err);
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Strategy 1: Network-First for navigation requests.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || caches.match('/index.html'); // Fallback to cached index.html
      })
    );
    return;
  }

  // Strategy 2: Stale-While-Revalidate for all other GET requests.
  if (request.method === 'GET') {
     event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cachedResponse = await cache.match(request);
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                    cache.put(request, networkResponse.clone());
                }
                return networkResponse;
            }).catch(err => {
                if (!cachedResponse) {
                    console.error('SW fetch failed, no cache fallback:', request.url, err);
                }
            });
            return cachedResponse || fetchPromise;
        })
     );
  }
});
