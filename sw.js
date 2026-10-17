/* Shruti Sadhana service worker: the app opens instantly from the device (and works offline).
   Each launch serves the saved copy, checks GitHub for a newer version in the background,
   and tells the page if one arrived so it can offer a refresh. No version bump needed when you upload a new index.html. */
const CACHE = 'shruti-sadhana';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
let updated = false;
self.addEventListener('message', e => {           // a freshly loaded page asks whether a newer version arrived
  if(e.data === 'check' && updated){ updated = false; e.source.postMessage('updated'); }
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate';
  const key = isPage ? new URL('./index.html', self.registration.scope).href : req.url;
  const cachedP = caches.open(CACHE).then(c => c.match(key));
  const netP = fetch(req.url, {cache: 'no-store', credentials: 'same-origin'});
  // background refresh: save the newest copy, and tell open pages if the app changed
  const updateP = Promise.all([cachedP, netP]).then(async ([cached, res]) => {
    if(!res || !res.ok) return;
    if(isPage && cached){
      const [a, b] = await Promise.all([cached.clone().text(), res.clone().text()]);
      if(a !== b){
        updated = true;
        (await self.clients.matchAll({type:'window'})).forEach(c => c.postMessage('updated'));
      }
    }
    await (await caches.open(CACHE)).put(key, res.clone());
  }).catch(() => {});
  e.respondWith(cachedP.then(cached => cached ? cached.clone() : netP.then(r => r.clone())));
  e.waitUntil(updateP);
});
