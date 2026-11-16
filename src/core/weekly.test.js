import { describe, it, expect } from 'vitest';
import {
  weekKey, drawWeek, weekDraw, rollWeek, weeklyProgress, payWeekly, countFoodBought, countItemBought,
  defaultWeekly,
} from './weekly.js';
import { weeklyPool } from '../data/quests/weekly.js';

// Local dates, like the rest of the app: 2026-11-16 is a Monday.
const at = (y, m, d, h = 10, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const MONDAY = at(2026, 11, 16);
const SUNDAY_LATE = at(2026, 11, 22, 23, 59);
const NEXT_MONDAY_MIDNIGHT = at(2026, 11, 23, 0, 0);

const tierOf = (id) => weeklyPool.find((q) => q.id === id).tier;

// The Monday `n` weeks after `start`, built from calendar components so DST cannot drift it.
const mondayPlus = (n) => new Date(2026, 10, 16 + 7 * n, 10).getTime();

const base = (extra = {}) => ({ coins: 0, history: {}, weekly: defaultWeekly(), ...extra });

describe('weekKey', () => {
  it('is the local date of the Monday that starts the week', () => {
    expect(weekKey(MONDAY)).toBe('2026-11-16');
    expect(weekKey(at(2026, 11, 19))).toBe('2026-11-16');
    expect(weekKey(SUNDAY_LATE)).toBe('2026-11-16');
  });

  it('turns over at Monday 00:00 local', () => {
    expect(weekKey(NEXT_MONDAY_MIDNIGHT)).toBe('2026-11-23');
    expect(weekKey(NEXT_MONDAY_MIDNIGHT - 1)).toBe('2026-11-16');
  });
});

describe('drawWeek', () => {
  it('draws three ids, one of each tier', () => {
    const ids = drawWeek(weeklyPool, '2026-11-16', []);
    expect(ids).toHaveLength(3);
    expect(ids.map(tierOf)).toEqual(['easy', 'medium', 'hard']);
  });

  it('is the same draw for the same week and the same previous ids', () => {
    expect(drawWeek(weeklyPool, '2026-11-16', [])).toEqual(drawWeek(weeklyPool, '2026-11-16', []));
  });

  it('never draws an id it was told to leave out', () => {
    const first = drawWeek(weeklyPool, '2026-11-16', []);
    const next = drawWeek(weeklyPool, '2026-11-16', first);
    expect(next.filter((id) => first.includes(id))).toEqual([]);
  });

  it('falls back to the whole tier when leaving ids out would empty it', () => {
    const tiny = [
      { id: 'e', tier: 'easy' }, { id: 'm', tier: 'medium' }, { id: 'h', tier: 'hard' },
    ];
    expect(drawWeek(tiny, '2026-11-16', ['e', 'm', 'h'])).toEqual(['e', 'm', 'h']);
  });

  it('does not use Math.random', () => {
    const real = Math.random;
    Math.random = () => { throw new Error('Math.random called'); };
    try {
      expect(() => drawWeek(weeklyPool, '2026-11-16', [])).not.toThrow();
    } finally {
      Math.random = real;
    }
  });
});

describe('rollWeek', () => {
  it('draws the first week for a save that has none', () => {
    const s = rollWeek(base(), weeklyPool, MONDAY);
    expect(s.weekly.week).toBe('2026-11-16');
    expect(s.weekly.ids).toEqual(weekDraw(weeklyPool, '2026-11-16'));
  });

  it('keeps the same three ids and paid state on a reload mid-week', () => {
    const rolled = rollWeek(base(), weeklyPool, MONDAY);
    const paid = { ...rolled, weekly: { ...rolled.weekly, paid: [rolled.weekly.ids[0]], foods: 2 } };
    expect(rollWeek(paid, weeklyPool, at(2026, 11, 20))).toBe(paid);
  });

  it('starts a new week on Monday 00:00 with new ids, nothing paid and the counters at zero', () => {
    const week1 = rollWeek(base(), weeklyPool, SUNDAY_LATE);
    const spent = {
      ...week1, weekly: { ...week1.weekly, paid: [...week1.weekly.ids], foods: 4, items: 2 },
    };
    const week2 = rollWeek(spent, weeklyPool, NEXT_MONDAY_MIDNIGHT);
    expect(week2.weekly).toEqual({
      week: '2026-11-23', ids: drawWeek(weeklyPool, '2026-11-23', week1.weekly.ids),
      paid: [], foods: 0, items: 0,
      // The week just over is remembered with what it paid (see the clock tests below).
      past: { '2026-11-16': week1.weekly.ids },
    });
  });

  it('never puts a quest in the week straight after the one it was in', () => {
    let s = base();
    let previous = [];
    for (let n = 0; n < 120; n += 1) {
      s = rollWeek(s, weeklyPool, mondayPlus(n));
      expect(s.weekly.ids.filter((id) => previous.includes(id))).toEqual([]);
      previous = s.weekly.ids;
    }
  });

  it('draws every quest in the pool sooner or later, and lets one come back after a gap', () => {
    let s = base();
    const seen = new Map();
    let cameBack = false;
    for (let n = 0; n < 200; n += 1) {
      s = rollWeek(s, weeklyPool, mondayPlus(n));
      for (const id of s.weekly.ids) {
        if (seen.has(id)) cameBack = true;
        seen.set(id, n);
      }
      expect(s.weekly.ids.map(tierOf)).toEqual(['easy', 'medium', 'hard']);
    }
    expect([...seen.keys()].sort()).toEqual(weeklyPool.map((q) => q.id).sort());
    expect(cameBack).toBe(true);
  });

  it('keeps every other field of the state', () => {
    const s = rollWeek(base({ coins: 9, questsPaid: ['blocks-1'] }), weeklyPool, MONDAY);
    expect(s.coins).toBe(9);
    expect(s.questsPaid).toEqual(['blocks-1']);
  });
});

describe('weeklyProgress', () => {
  const q = (kind, goal) => ({ id: 'x', title: 'x', kind, goal, reward: 5, tier: 'easy' });
  // Wednesday 2026-11-18; the Sunday before (11-15) belongs to the previous week.
  const WED = at(2026, 11, 18);
  const history = {
    '2026-11-15': { blocks: 9, minutes: 200 },
    '2026-11-16': { blocks: 2, minutes: 30 },
    '2026-11-18': { blocks: 3, minutes: 45 },
  };
  const s = base({ history, weekly: { ...defaultWeekly(), week: '2026-11-16', foods: 2, items: 1 } });

  it('counts blocks, minutes, days and the best day from this week only', () => {
    expect(weeklyProgress(q('weekBlocks', 10), s, WED)).toEqual({ current: 5, goal: 10, done: false });
    expect(weeklyProgress(q('weekMinutes', 90), s, WED)).toEqual({ current: 75, goal: 90, done: false });
    expect(weeklyProgress(q('weekMinutes', 75), s, WED)).toEqual({ current: 75, goal: 75, done: true });
    expect(weeklyProgress(q('weekDays', 3), s, WED)).toEqual({ current: 2, goal: 3, done: false });
    expect(weeklyProgress(q('weekBestDay', 3), s, WED)).toEqual({ current: 3, goal: 3, done: true });
  });

  it('caps current at the goal', () => {
    expect(weeklyProgress(q('weekBlocks', 4), s, WED)).toEqual({ current: 4, goal: 4, done: true });
  });

  it('reads the food and furniture counters of the current week', () => {
    expect(weeklyProgress(q('weekFoods', 3), s, WED)).toEqual({ current: 2, goal: 3, done: false });
    expect(weeklyProgress(q('weekItems', 1), s, WED)).toEqual({ current: 1, goal: 1, done: true });
  });

  it('reads stale counters from an older week as zero', () => {
    const later = at(2026, 11, 25);
    expect(weeklyProgress(q('weekFoods', 1), s, later).current).toBe(0);
  });
});

describe('payWeekly', () => {
  const pool = [
    { id: 'e', title: 'e', kind: 'weekBlocks', goal: 2, reward: 7, tier: 'easy' },
    { id: 'm', title: 'm', kind: 'weekFoods', goal: 1, reward: 12, tier: 'medium' },
    { id: 'h', title: 'h', kind: 'weekBlocks', goal: 20, reward: 19, tier: 'hard' },
  ];
  const WED = at(2026, 11, 18);
  const rolled = (extra) => rollWeek(base(extra), pool, WED);

  it('pays each done quest of the week once', () => {
    const s = rolled({ coins: 3, history: { '2026-11-17': { blocks: 2, minutes: 30 } } });
    const paid = payWeekly(s, pool, WED);
    expect(paid.coins).toBe(3 + 7);
    expect(paid.weekly.paid).toEqual(['e']);
    expect(payWeekly(paid, pool, WED)).toBe(paid);
  });

  it('pays nothing for history from before Monday', () => {
    const s = rolled({ history: { '2026-11-15': { blocks: 30, minutes: 600 } } });
    expect(payWeekly(s, pool, WED)).toBe(s);
  });

  it('pays nothing for an unfinished quest once its week is over', () => {
    const s = rolled({ history: { '2026-11-17': { blocks: 1, minutes: 15 } } });
    const nextWeek = at(2026, 11, 24);
    const rolledOn = rollWeek(s, pool, nextWeek);
    expect(payWeekly(rolledOn, pool, nextWeek).coins).toBe(0);
    // And a state still holding the old week pays nothing for it either.
    expect(payWeekly(s, pool, nextWeek)).toBe(s);
  });

  it('pays the same quest again when it is drawn in a later week', () => {
    let s = rolled({ history: { '2026-11-17': { blocks: 2, minutes: 30 } } });
    s = payWeekly(s, pool, WED);
    const later = at(2026, 12, 2);
    s = rollWeek({ ...s, history: { '2026-12-01': { blocks: 2, minutes: 30 } } }, pool, later);
    s = payWeekly(s, pool, later);
    expect(s.coins).toBe(14);
  });

  it('never touches the permanent paid list', () => {
    const s = rolled({ questsPaid: ['blocks-1'], history: { '2026-11-17': { blocks: 2, minutes: 30 } } });
    expect(payWeekly(s, pool, WED).questsPaid).toEqual(['blocks-1']);
  });
});

describe('the weekly counters', () => {
  const WED = at(2026, 11, 18);

  it('counts a food and a piece of furniture in the current week', () => {
    let s = rollWeek(base(), weeklyPool, WED);
    s = countFoodBought(s, weeklyPool, WED);
    s = countFoodBought(s, weeklyPool, WED);
    s = countItemBought(s, weeklyPool, WED);
    expect(s.weekly.foods).toBe(2);
    expect(s.weekly.items).toBe(1);
  });

  it('rolls into the new week before counting, so a Monday purchase is not wiped', () => {
    let s = rollWeek(base(), weeklyPool, SUNDAY_LATE);
    s = countFoodBought(s, weeklyPool, SUNDAY_LATE);
    s = countFoodBought(s, weeklyPool, NEXT_MONDAY_MIDNIGHT);
    expect(s.weekly.week).toBe('2026-11-23');
    expect(s.weekly.foods).toBe(1);
  });
});

describe('weekDraw', () => {
  const keyOf = (n) => weekKey(new Date(2026, 0, 5 + 7 * n, 12).getTime());

  it('never repeats a quest in the week straight after, over two years of weeks', () => {
    for (let n = 1; n < 104; n += 1) {
      const before = weekDraw(weeklyPool, keyOf(n - 1));
      for (const id of weekDraw(weeklyPool, keyOf(n))) expect(before).not.toContain(id);
    }
  });

  it('is what rollWeek draws, whatever week the save was left in', () => {
    const now = new Date(2026, 11, 9, 12).getTime();
    const fromNothing = rollWeek({}, weeklyPool, now).weekly.ids;
    const fromOld = rollWeek({ weekly: { week: '2026-11-30', ids: ['wk-blocks-3'], paid: [], foods: 0, items: 0 } }, weeklyPool, now).weekly.ids;
    expect(fromNothing).toEqual(weekDraw(weeklyPool, weekKey(now)));
    expect(fromOld).toEqual(fromNothing);
  });
});

// Setting the device clock back a week and forward again must not hand out a week's quests
// twice, and a clock that was once wrong in the future must not leave the week stuck there.
describe('rollWeek and a clock that moves around', () => {
  const W16 = MONDAY; // week of 2026-11-16
  const W23 = NEXT_MONDAY_MIDNIGHT; // week of 2026-11-23
  const paidIn = (week, paid) => ({ ...base(), weekly: { ...defaultWeekly(), week, ids: weekDraw(weeklyPool, week), paid } });

  it('remembers what a week paid when the clock goes back to it, and pays it no second time', () => {
    const w16 = paidIn('2026-11-16', [weekDraw(weeklyPool, '2026-11-16')[0]]);
    const w23 = rollWeek(w16, weeklyPool, W23);
    const backTo16 = rollWeek(w23, weeklyPool, W16);
    expect(backTo16.weekly.week).toBe('2026-11-16');
    expect(backTo16.weekly.paid).toEqual(w16.weekly.paid);
  });

  it('keeps the newer week too, when the clock comes forward again', () => {
    const w23 = paidIn('2026-11-23', [weekDraw(weeklyPool, '2026-11-23')[1]]);
    const again = rollWeek(rollWeek(w23, weeklyPool, W16), weeklyPool, W23);
    expect(again.weekly.paid).toEqual(w23.weekly.paid);
  });

  it('is never stuck in the future: a clock corrected back draws its own week', () => {
    const future = paidIn('2030-01-07', ['x']);
    const fixed = rollWeek(future, weeklyPool, W16);
    expect(fixed.weekly.week).toBe('2026-11-16');
    expect(fixed.weekly.ids).toEqual(weekDraw(weeklyPool, '2026-11-16'));
  });

  it('remembers at most ten weeks', () => {
    let s = paidIn('2026-01-05', ['q']);
    for (let n = 1; n <= 12; n += 1) s = { ...rollWeek(s, weeklyPool, new Date(2026, 0, 5 + 7 * n, 10).getTime()) };
    s = { ...s, weekly: { ...s.weekly, paid: ['q'] } };
    for (let n = 13; n <= 24; n += 1) {
      s = rollWeek(s, weeklyPool, new Date(2026, 0, 5 + 7 * n, 10).getTime());
      s = { ...s, weekly: { ...s.weekly, paid: ['q'] } };
    }
    expect(Object.keys(s.weekly.past).length).toBeLessThanOrEqual(10);
  });
});

describe('rollWeek memory covers every week the history can still prove', () => {
  // history keeps 60 days, so a week up to 8 back can still show its blocks; one moved clock
  // cycle to any of them must not pay that week again.
  it.each([1, 4, 8, 9])('pays nothing twice for a week %i back', (k) => {
    let s = { ...base(), weekly: defaultWeekly() };
    const mondayN = (n) => new Date(2026, 0, 5 + 7 * n, 10).getTime();
    for (let n = 0; n <= 12; n += 1) {
      s = rollWeek(s, weeklyPool, mondayN(n));
      s = { ...s, weekly: { ...s.weekly, paid: [...s.weekly.ids] } };
    }
    const back = rollWeek(s, weeklyPool, mondayN(12 - k));
    expect(back.weekly.paid).toEqual(weekDraw(weeklyPool, weekKey(mondayN(12 - k))));
  });
});
