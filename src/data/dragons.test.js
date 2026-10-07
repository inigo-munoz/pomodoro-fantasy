import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { dragons, getDragon } from './dragons.js';

describe('dragons data', () => {
  it('has at least one dragon with 4 ascending levels (egg → baby → young → adult)', () => {
    const d = dragons[0];
    expect(d.levels).toHaveLength(4);
    expect(d.levels[0].xpNeeded).toBe(0);
    expect(d.levels[1].xpNeeded).toBeGreaterThan(d.levels[0].xpNeeded);
    expect(d.levels[2].xpNeeded).toBeGreaterThan(d.levels[1].xpNeeded);
    expect(d.levels[3].xpNeeded).toBeGreaterThan(d.levels[2].xpNeeded);
  });

  it('getDragon returns a dragon by id and null when missing', () => {
    expect(getDragon('frost').id).toBe('frost');
    expect(getDragon('nope')).toBeNull();
  });

  it('every dragon level has an emoji fallback', () => {
    for (const d of dragons) {
      for (const lvl of d.levels) {
        expect(typeof lvl.fallback).toBe('string');
        expect(lvl.fallback.length).toBeGreaterThan(0);
      }
    }
  });

  // A broken sleep or flap path does not fall back to the awake art: art() swaps a 404 for
  // the emoji, so the child would see a 🐣 every break. Every path must exist on disk.
  it('every hatched level sleeps in its own art, and the adult has a wings-up frame', () => {
    for (const d of dragons) {
      const [egg, ...hatched] = d.levels;
      expect(egg.sleepImage).toBeUndefined();
      for (const lvl of hatched) {
        expect(lvl.sleepImage).toBe(lvl.image.replace('.webp', '-sleep.webp'));
        expect(existsSync(`public${lvl.sleepImage}`)).toBe(true);
      }
      const adult = d.levels[3];
      expect(adult.flapImage).toBe(adult.image.replace('.webp', '-flap.webp'));
      expect(existsSync(`public${adult.flapImage}`)).toBe(true);
    }
  });

  it('has a Blaze dragon with a themeId and 4 levels', () => {
    const blaze = getDragon('blaze');
    expect(blaze.name).toBe('Blaze');
    expect(blaze.themeId).toBe('blaze');
    expect(blaze.levels).toHaveLength(4);
    expect(blaze.levels[0].image).toBe('/art/dragons/blaze-egg.webp');
  });
});
