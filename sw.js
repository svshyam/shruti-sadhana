/* Shruti Sadhana has moved to https://carnaticsadhana.com/.
   This replacement service worker removes the old offline copy from devices that installed the app here,
   unregisters itself, and sends any open windows to the new address. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    await Promise.all((await caches.keys()).map(k => caches.delete(k)));
    await self.registration.unregister();
    (await self.clients.matchAll({type: 'window'})).forEach(c => c.navigate('https://carnaticsadhana.com/'));
  })());
});
