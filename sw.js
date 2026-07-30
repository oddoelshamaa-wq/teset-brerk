// sw.js
const CACHE_NAME = 'elshamaa-pwa-v' + Date.now();

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    })
  );
  // بلّغ كل الصفحات المفتوحة إن في تحديث
  self.clients.claim();
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
    });
  });
});

self.addEventListener('fetch', event => {
  // Network First مع كاش كـ fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // خزّن نسخة جديدة في الكاش
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
