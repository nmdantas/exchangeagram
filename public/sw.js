importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js');
importScripts('/src/js/domain.js');

const Modules = {};

const ServiceWorkerEventType = {
  Install: 'install',
  Activate: 'activate',
  Fetch: 'fetch',
  Message: 'message',
  Sync: 'sync',
  Push: 'push',
  NotificationClick: 'notificationclick',
  NotificationClose: 'notificationclose',
};

const AppServiceWorker = (() => {
  const StaticCacheControl = 'static-v33';
  const DynamicCacheControl = 'dynamic-v27';
  const FallbackPage = '/fallback.html';
  const StaticAssets = [
    '/',
    '/index.html',
    '/src/js/domain.js',
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
    'https://cdn.jsdelivr.net/npm/uuid@latest/dist/umd/uuidv4.min.js',
    'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
    FallbackPage,
  ];
  const StaticAssetsRegex = new RegExp(`\\b${StaticAssets.join('\\b|\\b')}\\b`);

  const checkCacheVersion = (cacheEntry) => cacheEntry !== StaticCacheControl && cacheEntry !== DynamicCacheControl;

  return {
    pages: {
      staticRegex: StaticAssetsRegex,
      static: StaticAssets,
      fallback: FallbackPage
    },
    cache: {
      checkVersion: checkCacheVersion,
      static: StaticCacheControl,
      dynamic: DynamicCacheControl,
    }
  }
})();

self.addEventListener(ServiceWorkerEventType.Message, (event) => {
  console.debug('[Service Worker] Message received...', event);

  if (event.data.type === 'module') {
    Modules[event.data.content.name] = event.data.content.module;
  }
});

self.addEventListener(ServiceWorkerEventType.Install, (event) => {
  console.debug('[Service Worker] Installing service worker...', event);
  event.waitUntil(
    caches.open(AppServiceWorker.cache.static).then((cache) => {
      console.debug('[Service Worker] Precaching app shell...');
      cache.addAll(AppServiceWorker.pages.static);
    })
  );
});

self.addEventListener(ServiceWorkerEventType.Activate, (event) => {
  console.debug('[Service Worker] Activating service worker...', event);

  const cleanOlderCache = async () => {
    const keys = await caches.keys();
    const cacheDelete = async (key) => {
      console.debug(`[Service Worker] Deleting entry "${key}" from cache...`);
      await caches.delete(key)
      console.debug(`[Service Worker] Entry "${key}" deleted from cache...`);
    };

    keys.filter(AppServiceWorker.cache.checkVersion).forEach(cacheDelete);
  };

  event.waitUntil(cleanOlderCache());

  return self.clients.claim();
});

self.addEventListener(ServiceWorkerEventType.Fetch, (event) => {
  console.debug(`[Service Worker] Fetch proxy (${event.request.url})`);

  const checkStaticContent = async (request) => {
    const cache = await caches.open(AppServiceWorker.cache.static);

    return cache.match(request)
  };

  const updateIndexedDB = async (response) => {
    const data = await response.json();
    await Domain.database.deleteAll(Domain.database.stores.posts);

    for (let key in data) {
      Domain.database.save(Domain.database.stores.posts, data[key]);
    }
  };

  const updateDynamicCache = async (response) => {
    const cache = await caches.open(AppServiceWorker.cache.dynamic);
    cache.put(event.request.url, response);
  };

  const cacheThenNetworkWithOnlineSupport = async (request) => {
    const staticContent = await checkStaticContent(request);

    if (staticContent) {
      console.debug(`[Service Worker] Cache Only Strategy`);

      return staticContent;
    } else if (request.url.indexOf(Domain.service.posts.url) > -1) {
      console.debug(`[Service Worker] Cache then Network Strategy`);

      const networkResponse = await fetch(request);

      updateIndexedDB(networkResponse.clone());

      return networkResponse;
    } else {
      console.debug(`[Service Worker] Cache with Network Fallback Strategy`);

      const cacheResponse = await caches.match(request);

      if (cacheResponse) {
        console.debug('[Service Worker] Returning response from cache...');
        return cacheResponse;
      }

      try {
        const networkResponse = await fetch(request);
  
        updateDynamicCache(networkResponse.clone());

        return networkResponse;
      } catch (error) {
        const getFallbackPage = async () => {
          const cache = await caches.open(AppServiceWorker.cache.static);
          return cache.match(AppServiceWorker.pages.fallback);
        };

        if (request.headers.get('accept').includes('text/html')) {
          return getFallbackPage();
        }
        
        throw error;
      }
    }
  };

  event.respondWith(cacheThenNetworkWithOnlineSupport(event.request));
});

self.addEventListener(ServiceWorkerEventType.Sync, (event) => {
  console.debug('[Service Worker] Background syncing', event);

  const registerPendingPosts = async () => {
    const pendingPosts = await Domain.database.findAll(Domain.database.stores.pendingPosts);

    for (let i = 0; i < pendingPosts.length; i++) {
      const pendingPost = pendingPosts[i];
      const response = await Domain.service.posts.save(pendingPost);

      if (response.ok) {
        await Domain.database.deleteById(Domain.database.stores.pendingPosts, pendingPost.id);
      }
    }
  };

  switch (event.tag) {
    case Domain.SyncEventType.Post:
      console.debug('[Service Worker] Syncing new posts...');
      event.waitUntil(registerPendingPosts());
      break;
    default:
      console.debug(`[Service Worker] Unknown tag ${event.tag} received to sync`);
      break;
  }
});

self.addEventListener(ServiceWorkerEventType.NotificationClick, (event) => {
  console.debug(`[Service Worker] Notification clicked`);

  const notification = event.notification;

  switch (event.action) {
    case Domain.notification.Actions.Confirm:
      break;
    default:
      console.debug(`[Service Worker] Unknown action "${event.action}" clicked`);
      break;
  }

  notification.close();
});

self.addEventListener(ServiceWorkerEventType.NotificationClose, (event) => {
  console.debug(`[Service Worker] Notification was closed`, event);
});