const CACHE = "passport-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Feed data changes often, so try the network first and fall back to the last copy.
const isData = url => /\/(data|news)\//.test(url.pathname);

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (isData(url)) {
    event.respondWith(
      fetch(event.request).then(res => {
        caches.open(CACHE).then(c => c.put(event.request, res.clone()));
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(res => {
      caches.open(CACHE).then(c => c.put(event.request, res.clone()));
      return res;
    }))
  );
});
