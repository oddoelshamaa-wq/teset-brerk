// اسم الكاش - يتغير تلقائياً عند كل بناء جديد لضمان التحديث
const CACHE_NAME = 'elshamaa-pwa-v' + Date.now();

// الملفات الأساسية المطلوب حفظها للعمل بدون إنترنت
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// 1. مرحلة التثبيت: إجبار النسخة الجديدة على العمل فوراً
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. مرحلة التنشيط: مسح أي كاش قديم نهائياً لتوفير المساحة ومنع التعليق
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

// 3. استراتيجية جلب الملفات (Network First): 
// يبحث عن الجديد في الإنترنت أولاً، وإذا لم يجد (أوفلاين) يفتح من الكاش.
// هذه أهم نقطة لضمان وصول تحديث الأدمن للموظف فوراً.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// 4. استقبال رسائل التحديث من الواجهة
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
