// This is a simple service worker for PWA with Monetag integration
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  return self.clients.claim();
});

// Monetag Service Worker code
// Replace the following section with the exact code provided by Monetag
// The code below is just a placeholder - use your actual Monetag code
self.monetag = {
  // This is where you would paste Monetag's configuration
  // For example:
  // id: "YOUR-MONETAG-ID",
  // config: { ... Monetag configuration ... }
};

// Keep original fetch event handler for basic PWA functionality
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Add any additional Monetag-specific event handlers if provided in their code
