// Minimal service worker.
//
// Chrome only installs a site as a real app, without the browser bar, when a
// service worker with a fetch handler is registered. This one deliberately
// caches nothing: the budget numbers must never be served stale, and a wrong
// number is worse than no number.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass through to the network, untouched.
  event.respondWith(fetch(event.request));
});
