// Service Worker for Attendance App PWA
const CACHE_NAME = "attendance-app-v1";
const OFFLINE_URL = "/offline";

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Pre-caching essential assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests and POST requests
  if (url.pathname.startsWith("/api/") || request.method !== "GET") {
    return;
  }

  // For navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Try to return cached version
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page as last resort
            return caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For other requests (JS, CSS, images) - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version but also update cache in background
        event.waitUntil(
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {
              // Ignore network errors for background updates
            })
        );
        return cachedResponse;
      }

      // No cache, try network
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return a fallback for images
          if (request.destination === "image") {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f3f4f6" width="100" height="100"/></svg>',
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// Listen for messages from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
