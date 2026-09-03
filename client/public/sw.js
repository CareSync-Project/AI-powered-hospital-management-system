const CACHE = 'caresync-shell-v2';
const SHELL = ['/index.html', '/offline.html', '/manifest.webmanifest', '/favicon.svg', '/icons/caresync-192.png', '/icons/caresync-512.png'];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('caresync-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html').then(response => response || caches.match('/offline.html'))));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && ['script','style','image','font'].includes(event.request.destination)) caches.open(CACHE).then(cache => cache.put(event.request,response.clone()));
    return response;
  })));
});
