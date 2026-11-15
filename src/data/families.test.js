import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { families, getFamily, familiesBackdrop } from './families.js';
import { dragons } from './dragons.js';

describe('families data', () => {
  it('offers Dragons, Cats, Unicorns and Wolves, in that order', () => {
    expect(families.map((f) => f.name)).toEqual(['Dragons', 'Cats', 'Unicorns', 'Wolves']);
  });

  it('gives every family a singular noun, an emoji and a theme line', () => {
    for (const f of families) {
      expect(f.noun.length).toBeGreaterThan(0);
      expect(f.icon.length).toBeGreaterThan(0);
      expect(f.tagline.length).toBeGreaterThan(0);
    }
  });

  // The card shows a baby of the family, from art that already ships, so it cannot 404.
  it('gives every family a picture of one of its own babies, on disk', () => {
    for (const f of families) {
      expect(f.image).toMatch(new RegExp(`^/art/${f.id}/[a-z]+-baby\\.webp$`));
      expect(existsSync(`public${f.image}`)).toBe(true);
    }
  });

  // Each chooser paints its own world behind the cards; the family screen paints all four.
  it('gives every family a backdrop of its own world, and the family screen one of all four, on disk', () => {
    for (const f of families) {
      expect(f.backdrop).toBe(`/art/backdrops/family-${f.id}.webp`);
      expect(existsSync(`public${f.backdrop}`)).toBe(true);
    }
    expect(familiesBackdrop).toBe('/art/backdrops/families.webp');
    expect(existsSync(`public${familiesBackdrop}`)).toBe(true);
  });

  it('getFamily returns a family by id and null when missing', () => {
    expect(getFamily('cats').name).toBe('Cats');
    expect(getFamily('nope')).toBeNull();
  });

  it('every creature belongs to a known family, and no family holds more than four', () => {
    for (const d of dragons) expect(getFamily(d.family)).not.toBeNull();
    for (const f of families) {
      expect(dragons.filter((d) => d.family === f.id).length).toBeLessThanOrEqual(4);
    }
  });

  it('the four original dragons are the Dragons family', () => {
    const ids = dragons.filter((d) => d.family === 'dragons').map((d) => d.id);
    expect(ids).toEqual(['frost', 'blaze', 'thorn', 'tempest']);
  });
});
