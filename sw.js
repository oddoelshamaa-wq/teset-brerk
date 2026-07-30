const CACHE_NAME = 'elshamaa-pwa-v' + Date.now();

const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// عند التثبيت
self.addEventListener('install', event => {
  self.skipWaiting(); // إجبار النسخة الجديدة على العمل فوراً
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// عند التنشيط (تنظيف الكاش القديم)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); 
});

// استراتيجية جلب الملفات (Network First) 
// هذا الجزء هو السر: يبحث عن النسخة الجديدة من الإنترنت أولاً، إذا لم يجد (أوفلاين) يفتح الكاش
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// استقبال رسالة التحديث من الواجهة
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
