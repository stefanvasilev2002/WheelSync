// WheelSync Service Worker
// Handles: App Shell caching, offline fallback, Push Notifications

const CACHE_NAME = 'wheelsync-v1';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// ─── Install: cache the app shell ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ─── Activate: delete old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch: network-first for API, cache-first for assets ────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and chrome-extension requests
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // API calls: network-only (no caching, offline handled by the app via IndexedDB)
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        // Cache successful responses for static assets
        if (response.ok && (url.pathname.match(/\.(js|css|woff2?|svg|ico)$/) || url.pathname === '/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });

      // Return cached version immediately, update in background; fall back to cache if offline
      return cached
        ? (networkFetch.catch(() => cached), cached)
        : networkFetch.catch(() => cached || caches.match('/'));
    })
  );
});

// ─── Push: show notification ──────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'WheelSync', body: 'Имате ново известување.', type: 'general' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    tag: data.type || 'wheelsync',
    renotify: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Отвори' },
      { action: 'dismiss', title: 'Откажи' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─── Notification click: focus or open the app ───────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(targetUrl);
      } else {
        clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Background sync: triggered by the app when back online ──────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'wheelsync-sync') {
    // The SyncService in the app handles the actual sync logic.
    // This event just wakes up the SW so the app can run the sync.
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        windowClients.forEach((client) => client.postMessage({ type: 'BACKGROUND_SYNC' }));
      })
    );
  }
});
