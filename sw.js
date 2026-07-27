const CACHE_NAME = 'elshamaa-pwa-v' + Date.now();
const urlsToCache = ['./', './index.html', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
      }));
    })
  );
  return self.clients.claim();
});

// استقبال التنبيه من السيرفر حتى لو التطبيق مغلق
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'https://z-cdn-media.chatglm.cn/files/7d4d1edb-d8aa-482e-840e-0492871f2bdf.jpg',
    badge: 'https://z-cdn-media.chatglm.cn/files/7d4d1edb-d8aa-482e-840e-0492871f2bdf.jpg',
    vibrate: [200, 100, 200, 100, 400],
    tag: 'oxidation-alert',
    renotify: true,
    data: { url: './index.html' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(res => res || fetch(event.request)));
});
