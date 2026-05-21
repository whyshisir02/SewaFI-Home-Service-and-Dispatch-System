const clearSewaFiCaches = async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith('sewafi-')).map((key) => caches.delete(key)));
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(clearSewaFiCaches());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clearSewaFiCaches()
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => Promise.all(clients.map((client) => client.navigate(client.url))))
  );
});

self.addEventListener('fetch', () => {});
