import { addCoins } from './wallet.js';
import { weekOf } from './history.js';

// Weekly quests: three drawn every calendar week (Monday to Sunday, local time), one per tier.
// When the week turns they go, paid or not, and three new ones are drawn. Pure, with `now`
// passed in and the pool handed over, like the rest of core.
//
// The save holds `weekly: { week, ids, paid, foods, items }`: the Monday key of the week the
// ids belong to, the ids of that week, which of them have paid, and the two counters history
// cannot answer. Everything about blocks and minutes is read from `history` instead.

const TIERS = ['easy', 'medium', 'hard'];

const PAST_WEEKS = 8;

export const defaultWeekly = () => ({ week: null, ids: [], paid: [], foods: 0, items: 0 });

// The local date of the Monday that starts the week holding `now`. The Monday-first week is
// history's own, so the two can never disagree about where a week begins.
export const weekKey = (now) => weekOf({}, now)[0].key;

// A string hash (FNV-1a) seeding a small PRNG (mulberry32): the same week key always gives the
// same sequence, so a draw is reproducible and needs no stored seed.
const hash = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const prng = (seed) => {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Three ids for the week `key`, one easy, one medium and one hard, none of them in
 * `previousIds`. A tier that would be left empty by the exclusion draws from all of it, so a
 * small pool still gives three quests.
 */
export const drawWeek = (pool, key, previousIds = []) => {
  const next = prng(hash(key));
  return TIERS.flatMap((tier) => {
    const all = pool.filter((q) => q.tier === tier);
    const fresh = all.filter((q) => !previousIds.includes(q.id));
    const from = fresh.length > 0 ? fresh : all;
    return from.length > 0 ? [from[Math.floor(next() * from.length)].id] : [];
  });
};

// The first week of the chain. Any Monday works; it only has to stay fixed forever, because
// moving it would change every later draw.
const EPOCH = '2026-01-05';

const mondayAfter = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return weekKey(new Date(y, m - 1, d + 7, 12).getTime());
};

/**
 * The three quests of the week `key`, as a function of the date alone: each week is drawn
 * leaving out the week before it, chained from EPOCH. Nothing stored takes part, so a week that
 * was only looked at (and never saved) still blocks a repeat the week after, and two devices
 * agree on the same week. A week before EPOCH is drawn on its own.
 */
export const weekDraw = (pool, key) => {
  if (key <= EPOCH) return drawWeek(pool, key, []);
  let week = EPOCH;
  let ids = drawWeek(pool, week, []);
  while (week < key) {
    week = mondayAfter(week);
    ids = drawWeek(pool, week, ids);
  }
  return ids;
};

const weeklyOf = (state) => ({ ...defaultWeekly(), ...state.weekly });

/**
 * Bring the state into the week holding `now`. The same week returns the state untouched, so a
 * reload keeps its three quests and what they paid. A new week takes that week's draw (see
 * weekDraw: it never repeats the week before) and starts nothing paid with both counters at zero.
 */
export const rollWeek = (state, pool, now) => {
  const key = weekKey(now);
  const weekly = weeklyOf(state);
  if (weekly.week === key) return state;
  // What each recent week paid is remembered, so a device clock set back to a week already
  // played (and then forward again) cannot pay that week's quests twice. Remembering instead
  // of refusing to go back means a clock that was once wrong in the future never leaves the
  // week stuck there. Only weeks that paid something, and only the latest PAST_WEEKS of them.
  const past = { ...(weekly.past ?? {}) };
  if (weekly.week && weekly.paid.length) past[weekly.week] = weekly.paid;
  const kept = Object.keys(past).sort().slice(-PAST_WEEKS);
  const remembered = Object.fromEntries(kept.map((week) => [week, past[week]]));
  return {
    ...state,
    weekly: {
      ...defaultWeekly(),
      week: key,
      ids: weekDraw(pool, key),
      paid: remembered[key] ?? [],
      ...(kept.length ? { past: remembered } : {}),
    },
  };
};

const measure = (quest, state, now) => {
  const weekly = weeklyOf(state);
  const current = weekly.week === weekKey(now);
  const days = weekOf(state.history ?? {}, now);
  switch (quest.kind) {
    case 'weekBlocks': return days.reduce((n, d) => n + d.blocks, 0);
    case 'weekMinutes': return days.reduce((n, d) => n + d.minutes, 0);
    case 'weekDays': return days.filter((d) => d.blocks > 0).length;
    case 'weekBestDay': return Math.max(0, ...days.map((d) => d.blocks));
    case 'weekFoods': return current ? weekly.foods : 0;
    case 'weekItems': return current ? weekly.items : 0;
    default: return 0;
  }
};

/**
 * How far a weekly quest has come this week. `current` is capped at `goal`.
 * @returns {{current: number, goal: number, done: boolean}}
 */
export const weeklyProgress = (quest, state, now) => {
  const raw = measure(quest, state, now);
  return { current: Math.min(raw, quest.goal), goal: quest.goal, done: raw >= quest.goal };
};

/**
 * Pay each of this week's quests that is done and not yet in the week's paid list. A state
 * still holding an older week pays nothing: that week is over. Idempotent, like payQuests.
 */
export const payWeekly = (state, pool, now) => {
  const weekly = weeklyOf(state);
  if (weekly.week !== weekKey(now)) return state;
  const due = weekly.ids
    .map((id) => pool.find((q) => q.id === id))
    .filter((q) => q && !weekly.paid.includes(q.id) && weeklyProgress(q, state, now).done);
  if (due.length === 0) return state;
  return {
    ...state,
    coins: due.reduce((coins, q) => addCoins(coins, q.reward), state.coins),
    weekly: { ...weekly, paid: [...weekly.paid, ...due.map((q) => q.id)] },
  };
};

// The counters roll into the current week first, so a purchase made just after Monday 00:00
// counts for the new week instead of being wiped by the roll that follows it.
const bump = (field) => (state, pool, now) => {
  const rolled = rollWeek(state, pool, now);
  const weekly = weeklyOf(rolled);
  return { ...rolled, weekly: { ...weekly, [field]: weekly[field] + 1 } };
};

export const countFoodBought = bump('foods');
export const countItemBought = bump('items');
