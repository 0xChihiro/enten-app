var CACHE_NAME = "enten-pwa-v5";
var APP_SHELL = [
  "/",
  "/index.html",
  "/launch.html",
  "/presale.html",
  "/swap.html",
  "/auction.html",
  "/wallet.html",
  "/docs.html",
  "/app.js",
  "/build-manifest.json",
  "/nav.css",
  "/styles.css",
  "/pwa.js",
  "/manifest.webmanifest",
  "/icons/enten-192.png",
  "/icons/enten-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL).then(function () {
        return fetch("/build-manifest.json", { cache: "no-cache" });
      }).then(function (response) {
        if (!response.ok) throw new Error("Could not load the build manifest.");
        return response.json();
      }).then(function (manifest) {
        return cache.addAll(manifest.precache || manifest.assets || []);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key.indexOf("enten-pwa-") === 0 && key !== CACHE_NAME;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Content-hashed build chunks never change at the same URL, so cache-first is
  // safe. Other local assets use stale-while-revalidate: repeat navigations and
  // reloads render immediately while a fresh response updates the cache.
  if (url.pathname.indexOf("/assets/") === 0) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetchAndCache(request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      var network = fetchAndCache(request);

      if (cached) {
        event.waitUntil(network.catch(function () {}));
        return cached;
      }

      return network.catch(function () {
        if (request.mode === "navigate") return caches.match("/index.html");
        return Response.error();
      });
    })
  );
});

function fetchAndCache(request) {
  return fetch(request).then(function (response) {
    if (!response.ok) return response;

    var copy = response.clone();
    return caches.open(CACHE_NAME).then(function (cache) {
      return cache.put(request, copy);
    }).then(function () {
      return response;
    });
  });
}
