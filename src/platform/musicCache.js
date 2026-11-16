// The service worker's rule for music, kept here so it can be tested without starting Vite.
// Workbox copies `urlPattern` into the worker as source text, so it must not use anything
// from this module's scope: only its arguments and the worker's own `self`.
export const musicCacheRule = (config) => ({
  // Keep a track the first time it is heard, and play it from the cache ever after. Only the
  // app's own audio: nothing else has any business filling a child's device.
  urlPattern: ({ request, url }) =>
    url.origin === self.location.origin
    && (request.destination === 'audio' || url.pathname.endsWith('.mp3')),
  handler: 'CacheFirst',
  options: {
    cacheName: 'pomodoro-music',
    // THE ONE THAT MATTERS: an <audio> element asks for byte RANGES, and a 206 is not
    // cacheable. Without this, a cached 200 gets handed back to a range request and
    // playback breaks on exactly the tablet this exists for — and never on a desktop,
    // so it would not be noticed until she was offline and silent.
    rangeRequests: true,
    // Same-origin only, so a complete 200 is the one response worth keeping.
    cacheableResponse: { statuses: [200] },
    // Room for every track of every style, counted from the catalogue so a new style cannot
    // silently push tracks out; and NO maxAgeSeconds on purpose: an age limit would quietly
    // evict a track weeks later and take offline music away again.
    expiration: { maxEntries: Object.values(config.music).flat().length },
  },
});
