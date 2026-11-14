import { describe, it, expect } from 'vitest';
import { families, getFamily } from './families.js';
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
