const FallbackPage = '/fallback.html';
const CacheControl = {
  Static: 'static-v8',
  Dynamic: 'dynamic-v3',
}
const ServiceWorkerEventType = {
  Install: 'install',
  Activate: 'activate',
  Fetch: 'fetch'
};

self.addEventListener(ServiceWorkerEventType.Install, (event) => {
  console.debug('[Service Worker] Installing service worker...', event);
  event.waitUntil(
    caches.open(CacheControl.Static).then((cache) => {
      console.debug('[Service Worker] Precaching app shell...');
      cache.addAll([
        '/',
        '/index.html',
        FallbackPage,
        '/src/js/app.js',
        '/src/js/feed.js',
        '/src/js/material.min.js',
        '/src/js/promise.js',
        '/src/js/fetch.js',
        '/src/css/app.css',
        '/src/css/feed.css',
        '/src/images/main-image.jpg',
        'https://fonts.googleapis.com/css?family=Roboto:400,700',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
      ]);
    })
  );
});

self.addEventListener(ServiceWorkerEventType.Activate, (event) => {
  console.debug('[Service Worker] Activating service worker...', event);

  const cleanOlderCache = async () => {
    const keys = await caches.keys();
    const cacheFilter = (key) => key !== CacheControl.Static && key !== CacheControl.Dynamic;
    const cacheDelete = async (key) => {
      console.debug(`[Service Worker] Deleting entry "${key}" from cache...`);
      await caches.delete(key)
      console.debug(`[Service Worker] Entry "${key}" deleted from cache...`);
    };

    keys.filter(cacheFilter).forEach(cacheDelete);
  };

  event.waitUntil(cleanOlderCache());

  return self.clients.claim();
});

self.addEventListener(ServiceWorkerEventType.Fetch, (event) => {
  console.debug(`[Service Worker] Fetch proxy (${event.request.url})`);

  event.respondWith(
    caches.match(event.request).then((cacheResponse) => {
      if (cacheResponse) {
        console.debug('[Service Worker] Returning response from cache...');
        return cacheResponse;
      }

      return fetch(event.request).then((fetchResponse) => {
        const updateDynamicCache = async () => {
          const cache = await caches.open(CacheControl.Dynamic);
          cache.put(event.request.url, fetchResponse);
        };

        updateDynamicCache();

        return fetchResponse.clone();
      }).catch((error) => {
        const getFallbackPage = async () => {
          const cache = await caches.open(CacheControl.Static);
          return cache.match(FallbackPage);
        };

        return getFallbackPage();
      });
    })
  );
});