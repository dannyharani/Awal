/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `asafu-cache-${version}`;

// Cache immutable build bundles and core static files (excluding huge raw seed JSON)
const STATIC_ASSETS = files.filter((file) => !file.includes('dglai_clean'));
const PRECACHE_ASSETS = [...build, ...STATIC_ASSETS];

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => sw.skipWaiting())
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      for (const key of keys) {
        if (key !== CACHE) {
          await caches.delete(key);
        }
      }
      await sw.clients.claim();
    })
  );
});

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin requests; leave Supabase API & auth untouched
  if (url.origin !== sw.location.origin) return;
  if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/api')) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      if (PRECACHE_ASSETS.includes(url.pathname)) {
        const cached = await cache.match(request);
        if (cached) return cached;
      }

      try {
        const response = await fetch(request);
        if (response.status === 200 && response.type === 'basic') {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        const fallback = await cache.match(request);
        if (fallback) return fallback;
        return Response.error();
      }
    })()
  );
});
