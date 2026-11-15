import { describe, it, expect } from 'vitest';
import { credits } from './credits.js';
import { config } from './config.js';

const entries = credits.flatMap((s) => s.items);
const credited = new Set(entries.flatMap((e) => e.files ?? []));

describe('credits data', () => {
  // Attribution is a condition of the CC BY music, so a track without a credit must not ship.
  it('credits every music track of every style', () => {
    for (const style of config.musicStyles) {
      for (const path of config.music[style]) expect(credited.has(path), path).toBe(true);
    }
  });

  it('credits every recorded sound effect', () => {
    for (const path of Object.values(config.effects)) expect(credited.has(path), path).toBe(true);
  });

  it('names a title, an author and a licence for every entry', () => {
    for (const e of entries) {
      expect(e.title, JSON.stringify(e)).toBeTruthy();
      expect(e.author, JSON.stringify(e)).toBeTruthy();
      expect(e.licence, JSON.stringify(e)).toBeTruthy();
    }
  });

  it('gives Towball the attribution CC BY 4.0 asks for: title, author, source and licence link', () => {
    const towball = entries.find((e) => e.author === 'Towball');
    expect(towball.licence).toBe('CC BY 4.0');
    expect(towball.source).toBe('towball.itch.io/towballs-crossing-deluxe');
    expect(towball.licenceUrl).toBe('creativecommons.org/licenses/by/4.0/');
    expect(towball.changes).toMatch(/96 kbps/);
  });
});
