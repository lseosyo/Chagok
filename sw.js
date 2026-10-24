var CACHE = 'app-v1';
var FILES = [
  'index.html', 'manifest.webmanifest', 'favicon.ico', 'thumbnail.jpg',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// 인터넷이 되면 항상 최신 파일, 안 되면 저장해 둔 파일 사용
// (Apps Script 등 다른 도메인 요청은 건드리지 않음 → 동기화에 영향 없음)
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('index.html'); });
    })
  );
});
