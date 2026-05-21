self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No fetch handler — browser handles all requests normally.
// An empty fetch handler causes a "no-op" warning and can block SPA navigation.