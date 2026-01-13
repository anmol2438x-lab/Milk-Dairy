const CACHE_NAME = "milk-app-v1";

const FILES_TO_CACHE = [
  "../",
  "../index.html",
  "../style.css",
  "../script.js",
  "../icons/milk-icon-192.png",
  "../icons/milk-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
