(function () {
  "use strict";

  var isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  document.documentElement.dataset.displayMode = isStandalone ? "standalone" : "browser";

  // Service-worker caching is intentionally disabled for now.
  // Cloudflare Pages serves clean URLs such as /presale, while the previous
  // worker precached .html routes such as /presale.html. That caused redirected
  // responses to be cached/intercepted and blocked page boot on subpages.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        registrations.forEach(function (registration) {
          registration.unregister();
        });
      }).catch(function () {
        /* Best-effort cleanup only. */
      });

      if ("caches" in window) {
        window.caches.keys().then(function (keys) {
          return Promise.all(keys.map(function (key) {
            return window.caches.delete(key);
          }));
        }).catch(function () {
          /* Cache deletion can fail in private browsing contexts. */
        });
      }
    });
  }
})();
