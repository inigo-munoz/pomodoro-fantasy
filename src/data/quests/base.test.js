import { describe, it, expect } from 'vitest';
import { basePack } from './base.js';
import { dragons } from '../dragons.js';
import { families } from '../families.js';
import { furniture, slots } from '../furniture.js';

const GUILT = /hungry|lost|missed|neglect|streak|warning|fail|expire|deadline|late|overdue/i;
const KINDS = ['blocks', 'lair', 'decorations', 'fullRoom', 'growing', 'fullGrown',
  'reached', 'everyFamily', 'placed', 'fullRooms', 'pets', 'owned'];
const creaturesIn = (family) => dragons.filter((d) => !family || d.family === family).length;

// The most each kind can ever measure with this catalogue: a goal above it could never be done.
const ceiling = (q) => ({
  blocks: Infinity,
  lair: 1,
  decorations: 1,
  fullRoom: slots.length,
  growing: 1,
  reached: creaturesIn(q.family),
  placed: dragons.length * slots.length,
  fullRooms: creaturesIn(q.family),
  pets: dragons.length,
  owned: dragons.length * furniture.length,
}[q.kind]);

describe('base quest pack', () => {
  it('holds about seventy quests, every id unique', () => {
    expect(basePack.length).toBeGreaterThanOrEqual(60);
    expect(basePack.length).toBeLessThanOrEqual(80);
    expect(new Set(basePack.map((q) => q.id)).size).toBe(basePack.length);
  });

  it('keeps the nine original ids with their exact kind, goal and reward', () => {
    const pick = (id) => basePack.find((q) => q.id === id);
    expect([
      'blocks-1', 'blocks-10', 'blocks-50', 'blocks-100', 'lair-open',
      'decor-1', 'room-full', 'dragon-grow', 'dragon-full',
    ].map((id) => { const q = pick(id); return q && [q.kind, q.goal, q.reward]; })).toEqual([
      ['blocks', 1, 5], ['blocks', 10, 15], ['blocks', 50, 40], ['blocks', 100, 75],
      ['lair', 1, 10], ['decorations', 1, 10], ['fullRoom', 4, 40],
      ['growing', 1, 20], ['fullGrown', null, 50],
    ]);
  });

  it('gives every quest a known kind, a title and a positive whole reward', () => {
    for (const q of basePack) {
      expect(KINDS).toContain(q.kind);
      expect(q.title.length).toBeGreaterThan(0);
      expect(Number.isInteger(q.reward) && q.reward > 0).toBe(true);
    }
  });

  it('only sets goals this catalogue can reach', () => {
    for (const q of basePack) {
      if (q.goal === null) {
        expect(['fullGrown', 'everyFamily']).toContain(q.kind);
        continue;
      }
      expect(Number.isInteger(q.goal) && q.goal > 0).toBe(true);
      expect(q.goal, q.id).toBeLessThanOrEqual(ceiling(q));
    }
  });

  it('names only real families and stages', () => {
    const familyIds = families.map((f) => f.id);
    for (const q of basePack) {
      if ('family' in q) expect(familyIds).toContain(q.family);
      if ('stage' in q) expect([1, 2, 'last']).toContain(q.stage);
      if (q.kind === 'reached' || q.kind === 'everyFamily') expect('stage' in q).toBe(true);
    }
  });

  it('covers every family with an adult, a whole grown family and a full room', () => {
    for (const f of families) {
      const has = (pred) => basePack.some((q) => q.family === f.id && pred(q));
      expect(has((q) => q.kind === 'reached' && q.stage === 'last' && q.goal === 1)).toBe(true);
      expect(has((q) => q.kind === 'reached' && q.stage === 'last' && q.goal === creaturesIn(f.id))).toBe(true);
      expect(has((q) => q.kind === 'fullRooms' && q.goal === 1)).toBe(true);
    }
  });

  it('never words a quest as something that can be missed or run out', () => {
    for (const q of basePack) expect(q.title, q.id).not.toMatch(GUILT);
  });

  it('pays roughly 2,000 to 2,800 coins in all, a fraction of the whole game', () => {
    const total = basePack.reduce((sum, q) => sum + q.reward, 0);
    expect(total).toBeGreaterThanOrEqual(2000);
    expect(total).toBeLessThanOrEqual(2800);
  });

  it('keeps the block ladder rising with effort', () => {
    const blocks = basePack.filter((q) => q.kind === 'blocks').sort((a, b) => a.goal - b.goal);
    for (let i = 1; i < blocks.length; i += 1) {
      expect(blocks[i].reward).toBeGreaterThanOrEqual(blocks[i - 1].reward);
    }
    expect(blocks.at(-1).goal).toBe(2000);
  });
});
