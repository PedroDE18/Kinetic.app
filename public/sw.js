// Service worker for Eunoia PWA on iPhone (iOS 16.4+) and modern browsers
const SW_VERSION = 'eunoia-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification received (from Web Push API)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Eunoia',
    body: 'Live deliberately today. Take care of your mind and body.',
    url: './',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: './apple-touch-icon.png',
    badge: './apple-touch-icon.png',
    vibrate: [120, 60, 120],
    data: {
      url: payload.url || './',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Open Eunoia' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Notification click event: focuses or opens Eunoia
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate?.(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Direct message from web app to display local in-app / scheduled notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, url } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'Eunoia', {
        body: body || 'Time for deliberate reflection.',
        icon: './apple-touch-icon.png',
        badge: './apple-touch-icon.png',
        tag: tag || 'eunoia-scheduled',
        vibrate: [100, 50, 100],
        data: { url: url || './' },
      })
    );
  }
});
