// 让网页版装到主屏幕后可以离线打开：页面每次先联网取最新版，没网时用缓存。
// 只处理页面本身和固定的程序文件；接口请求（api/…）和别的网站一律不碰，避免缓存住过期的内容。
const CACHE = 'dr-web-v3';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png',
  'vendor/marked.min.js', 'vendor/turndown.min.js', 'vendor/purify.min.js', 'vendor/mammoth.browser.min.js', 'vendor/tex-svg.js'];
const FILES = ASSETS.filter(a => a !== './');

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
  const isPage = r.mode === 'navigate' || u.pathname.endsWith('/index.html');
  const isAsset = FILES.some(f => u.pathname.endsWith('/' + f));
  if (!isPage && !isAsset) return;                       // api/docs 等：直接走网络
  const put = res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; };
  if (isPage) {
    e.respondWith(fetch(r).then(put).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(put)));
});
