// ========================================
// Service Worker مخصص للإشعارات والصوت
// ELSHAMAA - نظام تنبيهات البريك
// ========================================

const NOTIF_CACHE = 'elshamaa-notif-v' + Date.now();

// تثبيت
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(NOTIF_CACHE).then(cache => cache.addAll(['/']))
  );
  self.skipWaiting();
});

// تفعيل
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== NOTIF_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ========================================
// استقبال الرسائل وعرض الإشعارات
// ========================================
self.addEventListener('message', (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  // --- إشعار عادي ---
  if (type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, requireInteraction, vibrate, data } = payload;
    self.registration.showNotification(title, {
      body: body || '',
      icon: icon || 'https://z-cdn-media.chatglm.cn/files/7d4d1edb-d8aa-482e-840e-0492871f2bdf.jpg?auth_key=1881098147-176910170c5241b9b6f31936865757ae-0-e94dd5a43309ee23faa863616eaf3400',
      badge: 'https://z-cdn-media.chatglm.cn/files/7d4d1edb-d8aa-482e-840e-0492871f2bdf.jpg?auth_key=1881098147-176910170c5241b9b6f31936865757ae-0-e94dd5a43309ee23faa863616eaf3400',
      tag: tag || 'elshamaa-' + Date.now(),
      requireInteraction: requireInteraction !== false,
      vibrate: vibrate || [200, 100, 200, 100, 200, 100, 400],
      renotify: true,
      priority: 'high',
      silent: false,
      data: data || {}
    });
  }

  // --- إشعار الأكسدة (خطير) ---
  if (type === 'OXIDATION_ALERT') {
    self.registration.showNotification('⚠️ انتهاء البريك!', {
      body: payload.body || 'وقت البريك خلص! رجع شغلك فوراً',
      icon: 'https://z-cdn-media.chatglm.cn/files/7d4d1edb-d8aa-482e-840e-0492871f2bdf.jpg?auth_key=1881098147-176910170c5241b9b6f31936865757ae-0-e94dd5a43309ee23faa863616eaf3400',
      tag: 'oxidation-alert-' + (payload.userId || Date.now()),
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500, 200, 1000],
      renotify: true,
      priority: 'max',
      silent: false,
      actions: [
        { action: 'stop', title: '⏹ إيقاف التنبيه' },
        { action: 'extend', title: '⏰ تمديد 5 دقائق' }
      ],
      data: { userId: payload.userId, type: 'oxidation' }
    });
  }

  // --- إشعار تنبيه قبل الأكسدة (تحذير مسبق) ---
  if (type === 'PRE_OXIDATION_WARNING') {
    self.registration.showNotification('⏰ تنبيه البريك', {
      body: payload.body || 'متبقي 5 دقائق على انتهاء البريك!',
      icon: 'https://z-cdn-media.chatglm.cn/files/7d4d1edb-d8aa-482e-840e-0492871f2bdf.jpg?auth_key=1881098147-176910170c5241b9b6f31936865757ae-0-e94dd5a43309ee23faa863616eaf3400',
      tag: 'pre-oxidation-' + (payload.userId || Date.now()),
      requireInteraction: false,
      vibrate: [300, 100, 300],
      renotify: true,
      priority: 'high',
      data: { userId: payload.userId, type: 'pre-oxidation' }
    });
  }

  // --- تحديث إشعار موجود (العداد التنازلي) ---
  if (type === 'UPDATE_NOTIFICATION') {
    const { tag, body, progress } = payload;
    self.registration.getNotifications({ tag: tag }).then(notifications => {
      notifications.forEach(notification => {
        notification.close();
        self.registration.showNotification(notification.title, {
          body: body || notification.body,
          icon: notification.icon,
          tag: notification.tag,
          requireInteraction: notification.requireInteraction,
          vibrate: [],
          renotify: true,
          priority: notification.priority,
          data: notification.data
        });
      });
    });
  }

  // --- إلغاء إشعار معين ---
  if (type === 'CANCEL_NOTIFICATION') {
    const { tag } = payload;
    self.registration.getNotifications({ tag: tag }).then(notifications => {
      notifications.forEach(n => n.close());
    });
  }

  // --- إلغاء كل إشعارات الأكسدة ---
  if (type === 'CANCEL_ALL_OXIDATION') {
    self.registration.getNotifications().then(notifications => {
      notifications.forEach(n => {
        if (n.data && n.data.type === 'oxidation') n.close();
      });
    });
  }

  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// ========================================
// عند الضغط على الإشعار
// ========================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // لو ضغط على زر "إيقاف التنبيه" أو "تمديد"
  if (action === 'stop' || action === 'extend') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        if (clients.length > 0) {
          // أرسل رسالة للصفحة المفتوحة
          clients.forEach(client => {
            client.postMessage({
              type: 'NOTIFICATION_ACTION',
              action: action,
              userId: data.userId
            });
          });
          clients[0].focus();
        } else {
          // لو مفيش صفحة مفتوحة، افتح التطبيق
          self.clients.openWindow('./?action=' + action + '&userId=' + (data.userId || ''));
        }
      })
    );
    return;
  }

  // ضغطة عادية على الإشعار - افتح التطبيق
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('./');
      }
    })
  );
});
