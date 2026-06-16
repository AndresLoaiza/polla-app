/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<unknown> };

precacheAndRoute(self.__WB_MANIFEST);

// Lecturas Supabase: online fresco, offline cae al cache.
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/'),
  new NetworkFirst({
    cacheName: 'supabase-rest',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  }),
);

self.addEventListener('push', (event) => {
  let data: { title?: string; body?: string; url?: string } = {};
  try { data = event.data?.json() ?? {}; } catch { /* payload no-JSON */ }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Polla Mundial 2026', {
      body: data.body ?? 'Tienes predicciones pendientes',
      icon: `${self.registration.scope}pwa-192x192.png`,
      badge: `${self.registration.scope}pwa-192x192.png`,
      data: { url: data.url ?? self.registration.scope },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? self.registration.scope;
  event.waitUntil(self.clients.openWindow(url));
});
