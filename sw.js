/* Harbour Invoice — Service Worker
   构建版本 a218260ffd7d（内容哈希；应用一变，缓存自动失效）
   策略：页面导航 → 网络优先、失败回落缓存；静态资源 → 缓存优先
*/
const CACHE = 'harbour-invoice-a218260ffd7d';
const SHELL = ['./', './index.html', './manifest.json',
               './apple-touch-icon.png', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // cache:'no-store' —— 绕开浏览器 HTTP 缓存。GitHub Pages 会给 HTML 加
    // max-age=600 且无法覆盖，不绕开就会拿到旧页面。
    e.respondWith(fetch(req.url, {cache: 'no-store'}).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copy));
      return res;
    }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
