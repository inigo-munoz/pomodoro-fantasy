// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { musicCacheRule } from './platform/musicCache.js';
import { config } from './data/config.js';

const musicRule = () => musicCacheRule(config);

describe('service worker music cache', () => {
  const tracks = Object.values(config.music).flat().length;

  // Every track a child can pick must fit, or switching styles evicts offline music.
  it('has room for every track of every style', () => {
    expect(musicRule().options.expiration.maxEntries).toBeGreaterThanOrEqual(tracks);
  });

  it("keeps only the app's own audio, and only complete responses", () => {
    const { urlPattern, options } = musicRule();
    // urlPattern runs inside the service worker, where `self` is the worker scope.
    const here = 'https://inigo-munoz.github.io';
    globalThis.self = { location: new URL(here) };
    expect(urlPattern({ request: { destination: 'audio' }, url: new URL(`${here}/pomodoro-fantasy/art/music/a.mp3`) })).toBe(true);
    expect(urlPattern({ request: { destination: 'audio' }, url: new URL('https://elsewhere.example/a.mp3') })).toBe(false);
    expect(options.cacheableResponse.statuses).toEqual([200]);
  });
});
