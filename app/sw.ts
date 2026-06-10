import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, StaleWhileRevalidate, NetworkFirst, NetworkOnly, CacheFirst, ExpirationPlugin } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serviceWorkerSelf = self as ServiceWorkerGlobalScope & {
  addEventListener: (
    type: 'activate',
    listener: (event: { waitUntil: (promise: Promise<unknown>) => void }) => void,
  ) => void;
};

const DIRECT_LIST_CACHE = 'external-lists';
const PROXY_CACHE_HOSTS = new Set([
  'api.allorigins.win',
  'corsproxy.io',
  'api.codetabs.com',
  'proxy.killcors.com',
]);

// Caches left behind by the old next-pwa service worker. Its "start-url" cache
// stored the app HTML with no expiration, so failed navigations could be served
// a shell from a long-gone build whose hashed assets now 404 — an unstyled page
// that never hydrates. The current setup uses "serwist-"-prefixed cache names,
// so anything "workbox-"-prefixed is also legacy.
const LEGACY_CACHE_NAMES = new Set(['start-url']);
const LEGACY_CACHE_PREFIXES = ['workbox-'];
const MEDIA_CACHE_NAMES = new Set(['twitter-videos', 'static-video-assets']);

async function cleanupLegacyCaches() {
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames
      .filter(
        (name) =>
          LEGACY_CACHE_NAMES.has(name) ||
          LEGACY_CACHE_PREFIXES.some((prefix) => name.startsWith(prefix)) ||
          MEDIA_CACHE_NAMES.has(name),
      )
      .map((name) => caches.delete(name)),
  );
}

async function cleanupLegacyProxyEntries() {
  const cache = await caches.open(DIRECT_LIST_CACHE);
  const requests = await cache.keys();

  await Promise.all(
    requests.map(async (request) => {
      try {
        const url = new URL(request.url);
        if (PROXY_CACHE_HOSTS.has(url.hostname)) {
          await cache.delete(request);
        }
      } catch {
        // Ignore malformed cached request URLs.
      }
    }),
  );
}

// Optimized caching strategies for 1-week offline capability
const customRuntimeCaching = [
  // Direct list URLs only: NetworkFirst for fresh content, 1-week offline fallback.
  // Proxy-hosted list fetches stay uncached so fallback attempts always reflect live responses.
  {
    matcher: ({ url }: { url: URL }) =>
      url.hostname === 'raw.githubusercontent.com' ||
      url.hostname === 'gist.githubusercontent.com',
    handler: new NetworkFirst({
      cacheName: DIRECT_LIST_CACHE,
      networkTimeoutSeconds: 5, // Quick timeout to avoid slow loading
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          maxAgeFrom: "last-used"
        })
      ]
    })
  },
  // FxTwitter API responses: 1-week caching with reasonable limits
  {
    matcher: ({ url }: { url: URL }) => url.hostname === 'api.fxtwitter.com',
    handler: new StaleWhileRevalidate({
      cacheName: 'fxtwitter-api',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          maxAgeFrom: "last-used"
        })
      ]
    })
  },
  // Twitter images: 1-week storage-conscious caching
  {
    matcher: ({ url }: { url: URL }) =>
      url.hostname === 'pbs.twimg.com',
    handler: new CacheFirst({
      cacheName: 'twitter-images',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 400,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          maxAgeFrom: "last-used",
          purgeOnQuotaError: true
        })
      ]
    })
  },
  // Twitter videos must stream directly. Caching them forces the service worker
  // to clone large media responses while Safari is also decoding playback,
  // which can crash-reload iOS pages even outside standalone PWA mode.
  {
    matcher: ({ url }: { url: URL }) => url.hostname === 'video.twimg.com',
    handler: new NetworkOnly()
  },
  // YouTube oEmbed API responses: 1-week caching
  {
    matcher: ({ url }: { url: URL }) => 
      url.hostname === 'www.youtube.com' && url.pathname === '/oembed',
    handler: new StaleWhileRevalidate({
      cacheName: 'youtube-oembed',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
          maxAgeFrom: "last-used"
        })
      ]
    })
  },
  // Include default caching strategies for other content
  ...defaultCache
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customRuntimeCaching,
  // When a navigation can produce neither a network response nor a usable
  // runtime-cache entry (e.g. iOS reloads the PWA after a crash while the
  // network is down), serve the precached app shell of the current build
  // instead of failing. "/" is precached via additionalPrecacheEntries in
  // next.config.ts, so its assets are guaranteed to be precached alongside it.
  fallbacks: {
    entries: [
      {
        url: '/',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serviceWorkerSelf.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([cleanupLegacyProxyEntries(), cleanupLegacyCaches()]),
  );
});

serwist.addEventListeners();
