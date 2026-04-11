// Emergency kill-switch for old broken service workers.
// Runs synchronously BEFORE React hydrates, so it can recover
// clients that are crashing because of stale Next.js chunks
// cached by older versions of the service worker.
//
// Safe to remove in a few weeks once all active clients have recovered.
(function () {
  try {
    if (!("serviceWorker" in navigator) || !("caches" in window)) return;

    var OLD_CACHES = ["parcel-v1", "parcel-v2"];

    caches.keys().then(function (keys) {
      var bad = keys.filter(function (k) {
        return OLD_CACHES.indexOf(k) !== -1;
      });
      if (bad.length === 0) return;

      Promise.all(
        bad.map(function (k) {
          return caches.delete(k);
        }),
      ).then(function () {
        return navigator.serviceWorker.getRegistrations();
      }).then(function (regs) {
        return Promise.all(
          regs.map(function (r) {
            return r.unregister();
          }),
        );
      }).then(function () {
        if (!sessionStorage.getItem("parcel-sw-reset")) {
          sessionStorage.setItem("parcel-sw-reset", "1");
          window.location.reload();
        }
      });
    });
  } catch (e) {
    // Fail silently
  }
})();
