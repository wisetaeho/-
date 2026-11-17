from pathlib import Path

content = """const CACHE = 'hamkke-moim-v3-refresh';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isAppDocument =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/');

  if (isAppDocument) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request, { cache: 'no-store' });
        const copy = fresh.clone();
        const cache = await caches.open(CACHE);
        await cache.put(event.request, copy);
        return fresh;
      } catch (error) {
        return (await caches.match(event.request)) ||
               (await caches.match('./index.html'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const copy = response.clone();
        const cache = await caches.open(CACHE);
        await cache.put(event.request, copy);
      }
      return response;
    } catch (error) {
      return cached;
    }
  })());
});
"""

path = Path("/mnt/data/sw.js")
path.write_text(content, encoding="utf-8")
print(f"생성 완료: {path} ({path.stat().st_size} bytes)")
