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

  it.each([['frost', '❄️'], ['blaze', '🔥'], ['thorn', '🍃'], ['tempest', '⚡']])(
    'gives %s its own breath to roar out', (id, breath) => {
      expect(dragons.find((d) => d.id === id).breath).toBe(breath);
    },
  );
});

describe('creature families in the data', () => {
  // A creature is shipped with its whole line of art; a missing stage would show an emoji.
  it('every level image of every creature exists on disk', () => {
    for (const d of dragons) for (const lvl of d.levels) expect(existsSync(`public${lvl.image}`)).toBe(true);
  });

  it('starts the Cats family with Luna, from her basket to her moon pendant', () => {
    const luna = getDragon('luna');
    expect(luna.family).toBe('cats');
    expect(luna.themeId).toBe('luna');
    expect(luna.levels.map((l) => l.image)).toEqual([
      '/art/cats/luna-egg.webp', '/art/cats/luna-baby.webp',
      '/art/cats/luna-young.webp', '/art/cats/luna-adult.webp',
    ]);
  });

  it('fills the Unicorns family with Aurora, Nebula, Crystal and Candy, each born in a star', () => {
    const unicorns = dragons.filter((d) => d.family === 'unicorns');
    expect(unicorns.map((d) => d.name)).toEqual(['Aurora', 'Nebula', 'Crystal', 'Candy']);
    for (const u of unicorns) {
      expect(u.themeId).toBe(u.id);
      expect(u.levels[0].image).toBe(`/art/unicorns/${u.id}-egg.webp`);
    }
  });

  it('fills the Wolves family with Shadow, Amber, Tundra and Dusk, each from a cosy nest', () => {
    const wolves = dragons.filter((d) => d.family === 'wolves');
    expect(wolves.map((d) => d.name)).toEqual(['Shadow', 'Amber', 'Tundra', 'Dusk']);
    for (const w of wolves) {
      expect(w.themeId).toBe(w.id);
      expect(w.levels[0].image).toBe(`/art/wolves/${w.id}-egg.webp`);
    }
  });

  it('gives every family exactly four creatures', () => {
    for (const family of ['dragons', 'cats', 'unicorns', 'wolves']) {
      expect(dragons.filter((d) => d.family === family)).toHaveLength(4);
    }
  });

  it('fills the Cats family with Luna, Sahara, Sakura and Coral, each in her own world', () => {
    const cats = dragons.filter((d) => d.family === 'cats');
    expect(cats.map((d) => d.name)).toEqual(['Luna', 'Sahara', 'Sakura', 'Coral']);
    for (const c of cats) {
      expect(c.themeId).toBe(c.id);
      expect(c.levels[0].image).toBe(`/art/cats/${c.id}-egg.webp`);
    }
  });
});
