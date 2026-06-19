(function () {
  "use strict";

  var isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  document.documentElement.dataset.displayMode = isStandalone ? "standalone" : "browser";

  if (window.location.protocol === "https:" && "serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function (error) {
        console.warn("Enten PWA service worker registration failed", error);
      });
    });
  }
})();
