const CACHE_NAME = "nii-plants-shell-v1";
const PRECACHE_URLS = [
  "/",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/brand/nii-plants-logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("nii-plants-shell-") && name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      ),
    ),
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(request).catch(() =>
      caches.open(CACHE_NAME).then((cache) =>
        cache
          .match(request)
          .then(
            (cachedResponse) =>
              cachedResponse ?? cache.match("/offline.html"),
          ),
      ),
    ),
  );
});
