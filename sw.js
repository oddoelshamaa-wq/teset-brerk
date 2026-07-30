const CACHE_NAME = 'elshamaa-pwa-v' + Date.now();

// الملفات الأساسية اللي لازم تتخزن أول مرة
const CRITICAL_FILES = [
  './',
  './index.html'
];

// تثبيت Service Worker مع كاش للملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // نخزن الصفحة نفسها عشان تعمل Offline
      return cache.addAll(CRITICAL_FILES).catch(() => {
        // لو ملف معين فشل، نكمل بدون مشكلة
        console.log('بعض الملفات ما اتحملتش، ده طبيعي');
      });
    })
  );
  self.skipWaiting();
});

// تفعيل Service Worker وتنظيف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  // سيطرة على كل التبويبات المفتوحة فوراً
  self.clients.claim();
  
  // بلّغ كل الصفحات إن في تحديث
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
    });
  });
});

// استراتيجية: Stale While Revalidate
// أسرع استجابة + تحديث في الخلفية
self.addEventListener('fetch', event => {
  // نتجاهل طلبات Firebase وطلبات POST
  if (
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.method !== 'GET'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // لو الرد نجح، خزّنه في الكاش
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // لو النت فصل، رجّع الكاش لو موجود
          return cachedResponse;
        });

      // ارجع الكاش فوراً لو موجود، ولو لا انتظر النت
      return cachedResponse || fetchPromise;
    })
  );
});

// استقبال رسائل من الصفحة
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// إبقاء Service Worker شغال حتى لو التطبيق مغلق
// ده اللي بيخلي التطبيق يظهر في شاشة القفل
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('./');
      }
    })
  );
});
// معالجة إشعارات شاشة القفل
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, ...options } = event.data.payload;
    self.registration.showNotification(title, { body, ...options });
  }
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
