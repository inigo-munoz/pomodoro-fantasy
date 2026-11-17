import { describe, it, expect } from 'vitest';
import { petSound } from './petSound.js';

describe('petSound', () => {
  it('keeps the soft purr and chitter while the creature is an egg', () => {
    expect(petSound('cats', 1, false)).toBe('purr');
    for (const family of ['dragons', 'unicorns', 'wolves']) expect(petSound(family, 1, false)).toBe('chitter');
  });

  it('a baby has a little voice of its own: a kitten purrs, a foal sparkles, a pup whimpers, a dragonling squeaks', () => {
    expect(petSound('cats', 2, false)).toBe('purr');
    expect(petSound('unicorns', 2, false)).toBe('sparkle');
    expect(petSound('wolves', 2, false)).toBe('whimper');
    expect(petSound('dragons', 2, false)).toBe('squeak');
  });

  it('a young creature has a lighter call than an adult: meow, neigh, howl', () => {
    expect(petSound('cats', 3, false)).toBe('meowYoung');
    expect(petSound('unicorns', 3, false)).toBe('neighYoung');
    expect(petSound('wolves', 3, false)).toBe('howlYoung');
    expect(petSound('cats', 4, false)).toBe('meow');
    expect(petSound('unicorns', 4, false)).toBe('neigh');
    expect(petSound('wolves', 4, false)).toBe('howl');
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
