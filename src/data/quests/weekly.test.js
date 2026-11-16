import { describe, it, expect } from 'vitest';
import { weeklyPool } from './weekly.js';

const kinds = ['weekBlocks', 'weekMinutes', 'weekDays', 'weekBestDay', 'weekFoods', 'weekItems'];
const tiers = ['easy', 'medium', 'hard'];
const byTier = (tier) => weeklyPool.filter((q) => q.tier === tier);
const mean = (list) => list.reduce((sum, q) => sum + q.reward, 0) / list.length;

describe('the weekly quest pool', () => {
  // About forty at first; focus time became whole hours only (2026-11-16), leaving 33.
  it('holds a few dozen quests with unique ids', () => {
    expect(weeklyPool.length).toBeGreaterThanOrEqual(30);
    expect(weeklyPool.length).toBeLessThanOrEqual(45);
    expect(new Set(weeklyPool.map((q) => q.id)).size).toBe(weeklyPool.length);
  });

  it('gives every quest a title, a known kind and tier, and a positive whole goal and reward', () => {
    for (const q of weeklyPool) {
      expect(q.title, q.id).toMatch(/\S/);
      expect(kinds, q.id).toContain(q.kind);
      expect(tiers, q.id).toContain(q.tier);
      expect(Number.isInteger(q.goal) && q.goal > 0, q.id).toBe(true);
      expect(Number.isInteger(q.reward) && q.reward > 0, q.id).toBe(true);
    }
  });

  it('has enough of each tier that a week can always avoid the one before', () => {
    for (const tier of tiers) expect(byTier(tier).length, tier).toBeGreaterThanOrEqual(8);
  });

  it('pays about 12 coins a quest on average, easy least and hard most', () => {
    expect(mean(byTier('easy'))).toBeGreaterThanOrEqual(6);
    expect(mean(byTier('easy'))).toBeLessThanOrEqual(8);
    expect(mean(byTier('medium'))).toBeGreaterThanOrEqual(11);
    expect(mean(byTier('medium'))).toBeLessThanOrEqual(13);
    expect(mean(byTier('hard'))).toBeGreaterThanOrEqual(18);
    expect(mean(byTier('hard'))).toBeLessThanOrEqual(20);
    const week = (mean(byTier('easy')) + mean(byTier('medium')) + mean(byTier('hard'))) / 3;
    expect(week).toBeGreaterThanOrEqual(11);
    expect(week).toBeLessThanOrEqual(13.5);
  });

  it('keeps goals in reach of a child who does about 20 blocks a week', () => {
    for (const q of weeklyPool) {
      if (q.kind === 'weekBlocks') expect(q.goal, q.id).toBeLessThanOrEqual(20);
      if (q.kind === 'weekDays') expect(q.goal, q.id).toBeLessThanOrEqual(6);
      if (q.kind === 'weekBestDay') expect(q.goal, q.id).toBeLessThanOrEqual(8);
    }
    for (const q of byTier('easy').filter((x) => x.kind === 'weekBlocks')) {
      expect(q.goal, q.id).toBeLessThanOrEqual(5);
    }
  });

  it('never uses guilt or deadline wording', () => {
    const banned = /hungry|lost|missed|neglect|streak|warning|failed|expired|expire|deadline|hurry|before|left|ends|last chance|only \d+ days/i;
    for (const q of weeklyPool) expect(q.title, q.id).not.toMatch(banned);
  });
});

// Focus time is counted in whole hours, one per tier: easy to read for a child, and a clear
// step up from one to the next.
describe('weekly focus-time quests', () => {
  it('are one, two and three hours, easy, medium and hard', () => {
    const focus = weeklyPool.filter((q) => q.kind === 'weekMinutes')
      .map(({ goal, tier, title }) => ({ goal, tier, title }));
    expect(focus).toEqual([
      { goal: 60, tier: 'easy', title: 'An hour of focus' },
      { goal: 120, tier: 'medium', title: 'Two hours of focus' },
      { goal: 180, tier: 'hard', title: 'Three hours of focus' },
    ]);
  });
});
