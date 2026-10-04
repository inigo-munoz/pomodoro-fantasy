import { describe, it, expect } from 'vitest';
import { grantWorkReward, coinsForMinutes, buyFood, leveledUp, dragonXp, addDragonXp } from './game.js';
import { config } from '../data/config.js';
import { getDragon } from '../data/dragons.js';

const base = { version: 2, dragonId: 'frost', coins: 0, xpByDragon: {}, muted: false,
  settings: { workMinutes: 15, breakMinutes: 5 } };
const frost = getDragon('frost');

describe('game rules', () => {
  it('pays one coin for every two minutes of a completed work block, rounded down', () => {
    expect(config.minutesPerCoin).toBe(2);
    expect(grantWorkReward(base, config, 15).coins).toBe(7);
    expect(grantWorkReward(base, config, 25).coins).toBe(12);
    expect(grantWorkReward(base, config, 10).coins).toBe(5);
  });

  it('a 1-minute block pays nothing, so tiny blocks cannot farm coins', () => {
    expect(grantWorkReward(base, config, 1).coins).toBe(0);
  });

  it('honors the minutesPerCoin rate', () => {
    expect(coinsForMinutes(10, { minutesPerCoin: 1 })).toBe(10);
    expect(coinsForMinutes(10, { minutesPerCoin: 3 })).toBe(3);
  });

  it('grants nothing for a zero, negative or missing duration', () => {
    [0, -5, undefined, null, NaN].forEach((minutes) => {
      const s = grantWorkReward({ ...base, coins: 7 }, config, minutes);
      expect(s.coins).toBe(7);
      expect(Number.isNaN(s.coins)).toBe(false);
    });
  });

  it('does not mutate the input state', () => {
    const before = { ...base };
    const s = grantWorkReward(base, config, 15);
    expect(s).not.toBe(base);
    expect(base).toEqual(before);
  });

  it('dragonXp reads the active dragon and defaults to 0', () => {
    expect(dragonXp(base)).toBe(0);
    expect(dragonXp({ ...base, xpByDragon: { frost: 42 } })).toBe(42);
  });

  it('addDragonXp adds only to the active dragon and leaves others intact', () => {
    const s = addDragonXp({ ...base, xpByDragon: { blaze: 10 } }, 60);
    expect(s.xpByDragon.frost).toBe(60);
    expect(s.xpByDragon.blaze).toBe(10);
  });

  it('buying food spends coins and adds xp to the active dragon', () => {
    const rich = { ...base, coins: 100 };
    const food = { id: 'meat', price: 25, xp: 60 };
    const s = buyFood(rich, food);
    expect(s.coins).toBe(75);
    expect(dragonXp(s)).toBe(60);
  });

  it('buying food you cannot afford throws and does not mutate', () => {
    const poor = { ...base, coins: 5 };
    const food = { id: 'cake', price: 50, xp: 150 };
    expect(() => buyFood(poor, food)).toThrow();
    expect(poor.coins).toBe(5);
  });

  it('detects a level up across a threshold', () => {
    expect(leveledUp(frost, 90, 110)).toBe(true);   // crossed 100
    expect(leveledUp(frost, 110, 150)).toBe(false);  // same level
  });
});
