// KAHO Service Worker for PWA support
const CACHE_NAME = 'kaho-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let browser handle normal navigation and API calls
  if (event.request.method !== 'GET') return;
});
