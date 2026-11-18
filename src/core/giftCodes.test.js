import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeCode, findGiftCode, applyGift, giftCodes, sha256 } from './giftCodes.js';

// A made-up code for the tests: the real one must never be written in the project.
const hashOf = (text) => createHash('sha256').update(text).digest('hex');
const testCodes = [{ id: 'test-gift', hash: hashOf('TESTGIFT7'), coins: 100 }];

describe('gift codes', () => {
  it('ships only hashes', () => {
    for (const code of giftCodes) {
      expect(code.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(code.id).toMatch(/^[a-z0-9-]{1,32}$/);
      expect(code.coins).toBeGreaterThan(0);
    }
  });

  it('no file in src/ spells out a real code, in code, comments or tests', async () => {
    const real = new Set(giftCodes.map((c) => c.hash));
    const files = [];
    const walk = (dir) => readdirSync(dir).forEach((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path); else if (/\.(js|css|html)$/.test(name)) files.push(path);
    });
    walk('src');
    const leaks = [];
    for (const file of files) {
      const words = readFileSync(file, 'utf8').split(/[^A-Za-z0-9]+/).filter(Boolean);
      // A word alone, or two written with a space between them ("ab 12").
      const candidates = new Set([...words, ...words.slice(1).map((w, i) => words[i] + w)]);
      for (const word of candidates) if (real.has(hashOf(word.toUpperCase()))) leaks.push(file);
    }
    expect(leaks).toEqual([]);
  });

  it('reads a code however it is typed: case and spaces', () => {
    expect(normalizeCode('  testgift 7 ')).toBe('TESTGIFT7');
    expect(normalizeCode('TestGift7')).toBe('TESTGIFT7');
    expect(normalizeCode(undefined)).toBe('');
  });

  it('hashes the same way as Node', async () => {
    expect(await sha256('TESTGIFT7')).toBe(hashOf('TESTGIFT7'));
  });

  it('finds the gift a code stands for, typed any way', async () => {
    expect(await findGiftCode(' testgift 7', testCodes)).toBe(testCodes[0]);
  });

  it('an unknown or empty code finds nothing', async () => {
    for (const input of ['TESTGIFT8', '', '   ', null]) expect(await findGiftCode(input, testCodes)).toBeNull();
  });

  it('a gift adds its coins once and remembers it in the game, without touching the old state', () => {
    const before = Object.freeze({ coins: 5, dragonId: 'frost' });
    const result = applyGift(before, testCodes[0]);
    expect(result.status).toBe('gift');
    expect(result.coins).toBe(100);
    expect(result.state).toEqual({ coins: 105, dragonId: 'frost', giftCodes: ['test-gift'] });
    expect(before).toEqual({ coins: 5, dragonId: 'frost' });
  });

  it('a gift already used in this game gives nothing more', () => {
    const used = { coins: 5, giftCodes: ['test-gift'] };
    const result = applyGift(used, testCodes[0]);
    expect(result.status).toBe('used');
    expect(result.state).toBe(used);
  });
});
