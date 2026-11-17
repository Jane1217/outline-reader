// 让网页版装到主屏幕后可以离线打开：页面每次先联网取最新版，没网时用缓存。
const CACHE = 'dr-web-v2';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png',
  'vendor/marked.min.js', 'vendor/turndown.min.js', 'vendor/purify.min.js', 'vendor/mammoth.browser.min.js', 'vendor/tex-svg.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  const put = res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; };
  if (r.mode === 'navigate' || u.pathname.endsWith('index.html')) {
    e.respondWith(fetch(r).then(put).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(put)));
});
