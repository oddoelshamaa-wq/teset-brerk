// sw.js
const CACHE_NAME = 'elshamaa-pwa-v' + Date.now(); // كاش فريد لكل نسخة

self.addEventListener('install', event => {
  self.skipWaiting(); // إجبار النسخة الجديدة على التثبيت فوراً
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => caches.delete(key)) // مسح الكاش القديم تماماً عند التحديث
      );
    })
  );
  return self.clients.claim(); // السيطرة على كل الصفحات المفتوحة فوراً
});

self.addEventListener('fetch', event => {
  // استراتيجية: البحث في الإنترنت أولاً، لو فشل يفتح من الكاش
  // دي بتضمن إن الموظف يشوف التعديلات الجديدة طول ما فيه نت
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// استقبال رسالة التحديث الإجباري
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
