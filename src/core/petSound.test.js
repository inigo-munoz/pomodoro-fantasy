import { describe, it, expect } from 'vitest';
import { petSound } from './petSound.js';

describe('petSound', () => {
  it('keeps the soft purr and chitter while the creature is an egg or a baby', () => {
    for (const level of [1, 2]) {
      expect(petSound('cats', level, false)).toBe('purr');
      for (const family of ['dragons', 'unicorns', 'wolves']) expect(petSound(family, level, false)).toBe('chitter');
    }
  });

  it('gives a grown creature its own voice: meow, neigh, howl', () => {
    for (const level of [3, 4]) {
      expect(petSound('cats', level, false)).toBe('meow');
      expect(petSound('unicorns', level, false)).toBe('neigh');
      expect(petSound('wolves', level, false)).toBe('howl');
    }
  });

  it('a young dragon roars and a big one growls', () => {
    expect(petSound('dragons', 3, false)).toBe('roar');
    expect(petSound('dragons', 4, false)).toBe('growl');
  });

  it('a creature asleep on a break only purrs or chitters, however big', () => {
    expect(petSound('cats', 4, true)).toBe('purr');
    expect(petSound('wolves', 4, true)).toBe('chitter');
    expect(petSound('dragons', 4, true)).toBe('chitter');
  });
});
