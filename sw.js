const CACHE_NAME = 'jarvis-pwa-v17';
const PRECACHE_URLS = [
  './',
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './voices/greet_morning.mp3',
  './voices/greet_afternoon.mp3',
  './voices/greet_evening.mp3',
  './voices/id_boss.mp3',
  './voices/id_wife.mp3',
  './voices/id_son.mp3',
  './voices/ok_boss.mp3',
  './voices/ok_wife.mp3',
  './voices/ok_son.mp3',
  './voices/standby.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (event.request.method !== 'GET') return;

  // Cache-first for bundled Male voice MP3s (instant offline playback!)
  if (url.pathname.startsWith('./voices/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      }))
    );
    return;
  }

  // Network-first for /jarvis app shell, falling back to offline cache when laptop is off or no data
  if (url.pathname === './' || url.pathname.startsWith('./')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
  }
});
