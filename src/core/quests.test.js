import { describe, it, expect } from 'vitest';
import { questProgress, satisfiedQuests, payQuests } from './quests.js';
import { quests } from '../data/quests.js';
import { furniture, slots } from '../data/furniture.js';
import { dragons } from '../data/dragons.js';

const world = { furniture, slots, dragons };
const quest = (id) => quests.find((q) => q.id === id);
const ORIGINAL_IDS = [
  'blocks-1', 'blocks-10', 'blocks-50', 'blocks-100', 'lair-open',
  'decor-1', 'room-full', 'dragon-grow', 'dragon-full',
];
// The nine quests the first release shipped. Tests that pin their exact payouts run against
// this subset, so the larger ladder cannot hide a change in how the originals behave.
const original = ORIGINAL_IDS.map(quest);
const progress = (id, state) => questProgress(quest(id), state, world);
const GUILT = /hungry|lost|missed|neglect|streak|warning|expire|deadline|late|fail|overdue/i;

const base = (over = {}) => ({
  coins: 0, lifetimeBlocks: 0, lairUnlocked: false, lairs: {}, xpByDragon: {}, questsPaid: [], ...over,
});
const room = (slotMap) => ({ lairs: { frost: { owned: Object.values(slotMap), slots: slotMap } } });
const fullRoom = { wall: 'banner', floorLeft: 'bed', floorRight: 'lamp', center: 'imp' };

describe('quest catalogue', () => {
  it('still holds the nine original quests, each with its kind, goal and reward unchanged', () => {
    expect(original.map((q) => q && [q.id, q.kind, q.goal, q.reward])).toEqual([
      ['blocks-1', 'blocks', 1, 5], ['blocks-10', 'blocks', 10, 15],
      ['blocks-50', 'blocks', 50, 40], ['blocks-100', 'blocks', 100, 75],
      ['lair-open', 'lair', 1, 10], ['decor-1', 'decorations', 1, 10],
      ['room-full', 'fullRoom', 4, 40], ['dragon-grow', 'growing', 1, 20],
      ['dragon-full', 'fullGrown', null, 50],
    ]);
    for (const q of quests) expect(q.title.length).toBeGreaterThan(0);
  });

  it('never words a quest as something that can be missed or run out', () => {
    for (const q of quests) expect(q.title).not.toMatch(GUILT);
  });
});

describe('questProgress', () => {
  it('counts lifetime blocks toward a block quest', () => {
    expect(progress('blocks-10', base({ lifetimeBlocks: 3 }))).toEqual({ current: 3, goal: 10, done: false });
  });

  it('is done exactly at the goal and one past it, never showing more than the goal', () => {
    expect(progress('blocks-10', base({ lifetimeBlocks: 10 }))).toEqual({ current: 10, goal: 10, done: true });
    expect(progress('blocks-10', base({ lifetimeBlocks: 11 }))).toEqual({ current: 10, goal: 10, done: true });
    expect(progress('blocks-10', base({ lifetimeBlocks: 9 })).done).toBe(false);
  });

  it('reads the lair as 0 / 1 until it is unlocked', () => {
    expect(progress('lair-open', base())).toEqual({ current: 0, goal: 1, done: false });
    expect(progress('lair-open', base({ lairUnlocked: true }))).toEqual({ current: 1, goal: 1, done: true });
  });

  it('counts a decoration in any lair, and the fullest single room for the full-room quest', () => {
    expect(progress('decor-1', base())).toEqual({ current: 0, goal: 1, done: false });
    const one = base(room({ wall: 'banner' }));
    expect(progress('decor-1', one).done).toBe(true);
    expect(progress('room-full', one)).toEqual({ current: 1, goal: 4, done: false });
    const three = base(room({ wall: 'banner', floorLeft: 'bed', center: 'imp' }));
    expect(progress('room-full', three).current).toBe(3);
    expect(progress('room-full', base(room(fullRoom)))).toEqual({ current: 4, goal: 4, done: true });
  });

  it('does not add up slots across different lairs for the full-room quest', () => {
    const state = base({ lairs: {
      frost: { owned: ['banner', 'bed'], slots: { wall: 'banner', floorLeft: 'bed' } },
      blaze: { owned: ['lamp', 'imp'], slots: { floorRight: 'lamp', center: 'imp' } },
    } });
    expect(progress('room-full', state)).toEqual({ current: 2, goal: 4, done: false });
    expect(progress('decor-1', state).done).toBe(true);
  });

  it('ignores a saved id the catalogue no longer holds or that belongs to another slot', () => {
    expect(progress('decor-1', base(room({ wall: 'ghost' }))).done).toBe(false);
    expect(progress('decor-1', base(room({ wall: 'bed' }))).done).toBe(false);
  });

  it('treats a growing dragon as any dragon past its first stage', () => {
    expect(progress('dragon-grow', base())).toEqual({ current: 0, goal: 1, done: false });
    expect(progress('dragon-grow', base({ xpByDragon: { frost: 99 } })).done).toBe(false);
    expect(progress('dragon-grow', base({ xpByDragon: { frost: 100 } }))).toEqual({ current: 1, goal: 1, done: true });
  });

  it('measures a full-grown dragon by stages climbed, done only at the last stage', () => {
    expect(progress('dragon-full', base({ xpByDragon: { blaze: 300 } }))).toEqual({ current: 2, goal: 3, done: false });
    expect(progress('dragon-full', base({ xpByDragon: { blaze: 600 } }))).toEqual({ current: 3, goal: 3, done: true });
    expect(progress('dragon-full', base({ xpByDragon: { blaze: 5000 } }))).toEqual({ current: 3, goal: 3, done: true });
  });

  it('takes the best dragon, not the sum of all of them', () => {
    expect(progress('dragon-full', base({ xpByDragon: { frost: 300, blaze: 300 } })).current).toBe(2);
  });

  it('survives a save with none of the fields', () => {
    expect(progress('blocks-1', {}).current).toBe(0);
    expect(progress('decor-1', {}).done).toBe(false);
    expect(progress('dragon-grow', {}).done).toBe(false);
  });
});

describe('satisfiedQuests', () => {
  it('is empty for a state with nothing yet', () => {
    expect(satisfiedQuests(original, base(), world)).toEqual([]);
  });

  it('lists every quest the state satisfies, paid or not', () => {
    const state = base({ lifetimeBlocks: 10, lairUnlocked: true, questsPaid: ['blocks-1'] });
    expect(satisfiedQuests(original, state, world).map((q) => q.id))
      .toEqual(['blocks-1', 'blocks-10', 'lair-open']);
  });
});

describe('payQuests', () => {
  it('pays nothing for a state with nothing yet', () => {
    const state = base({ coins: 7 });
    const next = payQuests(state, original, world);
    expect(next).toEqual(state);
    expect(next.questsPaid).toEqual([]);
  });

  it('adds the reward and records the id', () => {
    const next = payQuests(base({ coins: 7, lifetimeBlocks: 1 }), original, world);
    expect(next.coins).toBe(12);
    expect(next.questsPaid).toEqual(['blocks-1']);
  });

  it('pays once, ever: a second run on the result moves no coins and adds no ids', () => {
    const once = payQuests(base({ coins: 7, lifetimeBlocks: 1 }), original, world);
    const twice = payQuests(once, original, world);
    expect(twice.coins).toBe(once.coins);
    expect(twice.questsPaid).toEqual(once.questsPaid);
    expect(payQuests(twice, original, world).coins).toBe(12);
  });

  it('never pays an id that is already in the list, even though it is satisfied', () => {
    const state = base({ coins: 100, lifetimeBlocks: 1, questsPaid: ['blocks-1'] });
    expect(payQuests(state, original, world).coins).toBe(100);
  });

  it('pays only the quest that is not yet paid, not the ones already settled', () => {
    const state = base({ coins: 0, lifetimeBlocks: 10, questsPaid: ['blocks-1'] });
    const next = payQuests(state, original, world);
    expect(next.coins).toBe(15);
    expect(next.questsPaid).toEqual(['blocks-1', 'blocks-10']);
  });

  it('keeps the coins spent: a paid quest is not paid again after the purse is emptied', () => {
    const paid = payQuests(base({ lifetimeBlocks: 1 }), original, world);
    const spent = { ...paid, coins: 0 };
    expect(payQuests(spent, original, world).coins).toBe(0);
  });

  it('pays the first four block quests at once from 128 lifetime blocks, and only once', () => {
    const once = payQuests(base({ lifetimeBlocks: 128 }), original, world);
    expect(once.coins).toBe(5 + 15 + 40 + 75);
    expect(once.questsPaid).toEqual(['blocks-1', 'blocks-10', 'blocks-50', 'blocks-100']);
    const again = payQuests(once, original, world);
    expect(again.coins).toBe(135);
    expect(again.questsPaid).toEqual(once.questsPaid);
  });

  it('pays the full-room quest, and the first decoration with it, when the fourth slot fills', () => {
    const next = payQuests(base(room(fullRoom)), original, world);
    expect(next.questsPaid).toEqual(['decor-1', 'room-full']);
    expect(next.coins).toBe(50);
  });

  it('leaves every other field of the state alone and does not mutate the input', () => {
    const state = base({ coins: 1, lifetimeBlocks: 1, dragonId: 'frost', history: { a: 1 } });
    const frozen = JSON.parse(JSON.stringify(state));
    const next = payQuests(state, original, world);
    expect(state).toEqual(frozen);
    expect(next).toEqual({ ...state, coins: 6, questsPaid: ['blocks-1'] });
  });

  it('copes with a save that has no questsPaid at all', () => {
    const next = payQuests({ coins: 0, lifetimeBlocks: 1 }, original, world);
    expect(next.questsPaid).toEqual(['blocks-1']);
    expect(payQuests(next, original, world).coins).toBe(5);
  });
});

// Hand-built quests for the measure kinds the larger ladder adds, so each kind is pinned on
// its own, independent of the rewards and titles the catalogue gives it.
const q = (kind, goal, extra = {}) => ({ id: `t-${kind}`, title: 't', reward: 1, kind, goal, ...extra });
const measured = (quest, state) => questProgress(quest, base(state), world);
const ids = (family) => dragons.filter((d) => d.family === family).map((d) => d.id);
const xpAll = (list, xp) => Object.fromEntries(list.map((id) => [id, xp]));
const lairsOf = (map) => ({ lairs: Object.fromEntries(Object.entries(map).map(([id, slotMap]) => (
  [id, { owned: Object.values(slotMap), slots: slotMap }]))) });

describe('questProgress: creatures that reached a stage', () => {
  it('counts every creature at the stage or past it, from zero to capped', () => {
    const babies = q('reached', 2, { stage: 1 });
    expect(measured(babies, {})).toEqual({ current: 0, goal: 2, done: false });
    expect(measured(babies, { xpByDragon: { frost: 99, luna: 100 } })).toEqual({ current: 1, goal: 2, done: false });
    expect(measured(babies, { xpByDragon: { frost: 600, luna: 100, dusk: 300 } }))
      .toEqual({ current: 2, goal: 2, done: true });
  });

  it('reads "last" as each creature\'s final stage', () => {
    const adults = q('reached', 16, { stage: 'last' });
    expect(measured(adults, { xpByDragon: { frost: 599, luna: 600 } }).current).toBe(1);
    expect(measured(adults, { xpByDragon: xpAll(dragons.map((d) => d.id), 600) }))
      .toEqual({ current: 16, goal: 16, done: true });
  });

  it('counts only one family when the quest names one', () => {
    const grownCats = q('reached', 4, { stage: 'last', family: 'cats' });
    const state = { xpByDragon: { ...xpAll(ids('dragons'), 600), luna: 600, coral: 600 } };
    expect(measured(grownCats, state)).toEqual({ current: 2, goal: 4, done: false });
    expect(measured(grownCats, { xpByDragon: xpAll(ids('cats'), 900) }).done).toBe(true);
  });

  it('ignores xp saved for an id the catalogue no longer holds', () => {
    expect(measured(q('reached', 1, { stage: 1 }), { xpByDragon: { ghost: 5000 } }).current).toBe(0);
  });
});

describe('questProgress: every family', () => {
  it('counts the families with a creature at the stage, and the goal is the number of families', () => {
    const everyFamily = q('everyFamily', null, { stage: 'last' });
    expect(measured(everyFamily, {})).toEqual({ current: 0, goal: 4, done: false });
    const twoFamilies = { xpByDragon: { frost: 600, blaze: 600, luna: 600, aurora: 300 } };
    expect(measured(everyFamily, twoFamilies)).toEqual({ current: 2, goal: 4, done: false });
    const all = { xpByDragon: { thorn: 600, sakura: 600, candy: 600, dusk: 600 } };
    expect(measured(everyFamily, all)).toEqual({ current: 4, goal: 4, done: true });
  });

  it('works for a lower stage too', () => {
    const babyEach = q('everyFamily', null, { stage: 1 });
    expect(measured(babyEach, { xpByDragon: { frost: 100, luna: 100, aurora: 100, shadow: 99 } }).current).toBe(3);
  });
});

describe('questProgress: decorations, rooms, pets and treasures across every lair', () => {
  const full = { wall: 'banner', floorLeft: 'bed', floorRight: 'lamp', center: 'imp' };

  it('adds placed decorations across lairs, ignoring stale or misplaced ids', () => {
    const placed = q('placed', 5);
    expect(measured(placed, {})).toEqual({ current: 0, goal: 5, done: false });
    const state = lairsOf({ frost: { wall: 'banner', floorLeft: 'bed' }, luna: { center: 'imp', floorRight: 'ghost' }, dusk: { wall: 'bed' } });
    expect(measured(placed, state)).toEqual({ current: 3, goal: 5, done: false });
    expect(measured(placed, lairsOf({ frost: full, luna: full })).current).toBe(5);
  });

  it('counts rooms with all four slots filled, not the fullest single room', () => {
    const rooms = q('fullRooms', 2);
    expect(measured(rooms, {})).toEqual({ current: 0, goal: 2, done: false });
    expect(measured(rooms, lairsOf({ frost: full, luna: { wall: 'banner' } })).current).toBe(1);
    expect(measured(rooms, lairsOf({ frost: full, luna: full, dusk: full })))
      .toEqual({ current: 2, goal: 2, done: true });
  });

  it('counts full rooms of one family when the quest names one', () => {
    const catRoom = q('fullRooms', 1, { family: 'cats' });
    expect(measured(catRoom, lairsOf({ frost: full, blaze: full })).done).toBe(false);
    expect(measured(catRoom, lairsOf({ frost: full, sahara: full })))
      .toEqual({ current: 1, goal: 1, done: true });
  });

  it('counts rooms with a pet in the middle', () => {
    const pets = q('pets', 2);
    expect(measured(pets, {})).toEqual({ current: 0, goal: 2, done: false });
    expect(measured(pets, lairsOf({ frost: { center: 'imp' }, luna: { wall: 'banner' }, dusk: { center: 'lamp' } })).current).toBe(1);
    expect(measured(pets, lairsOf({ frost: { center: 'imp' }, luna: { center: 'bird' }, dusk: { center: 'hatchling' } })))
      .toEqual({ current: 2, goal: 2, done: true });
  });

  it('counts every catalogue item owned in every lair, once per lair', () => {
    const owned = q('owned', 10);
    expect(measured(owned, {})).toEqual({ current: 0, goal: 10, done: false });
    const state = { lairs: {
      frost: { owned: ['banner', 'bed', 'bed', 'ghost'], slots: {} },
      luna: { owned: ['banner', 'imp'], slots: { wall: 'banner' } },
    } };
    expect(measured(owned, state)).toEqual({ current: 4, goal: 10, done: false });
    const everything = { lairs: Object.fromEntries(dragons.map((d) => [d.id, { owned: furniture.map((i) => i.id), slots: {} }])) };
    expect(measured(q('owned', 192), everything)).toEqual({ current: 192, goal: 192, done: true });
  });

  it('survives a save with none of the fields for every new kind', () => {
    for (const kind of ['reached', 'everyFamily', 'placed', 'fullRooms', 'pets', 'owned']) {
      expect(questProgress(q(kind, 1, { stage: 1 }), {}, world).current).toBe(0);
    }
  });
});

describe('payQuests over the whole ladder', () => {
  it('never pays the nine original quests again to a save that already holds them', () => {
    const state = base({
      coins: 0, lifetimeBlocks: 100, lairUnlocked: true, questsPaid: [...ORIGINAL_IDS],
      xpByDragon: { frost: 600 }, ...room(fullRoom),
    });
    const next = payQuests(state, quests, world);
    const newlyPaid = next.questsPaid.slice(ORIGINAL_IDS.length);
    expect(newlyPaid.some((id) => ORIGINAL_IDS.includes(id))).toBe(false);
    const expected = quests.filter((x) => newlyPaid.includes(x.id)).reduce((sum, x) => sum + x.reward, 0);
    expect(next.coins).toBe(expected);
    expect(newlyPaid).toContain('blocks-5');
    expect(payQuests(next, quests, world)).toEqual(next);
  });

  it('pays every satisfied rung of the block ladder at once from 128 lifetime blocks, and only once', () => {
    const once = payQuests(base({ lifetimeBlocks: 128 }), quests, world);
    expect(once.questsPaid).toEqual(['blocks-1', 'blocks-5', 'blocks-10', 'blocks-25', 'blocks-50', 'blocks-75', 'blocks-100']);
    expect(once.coins).toBe(quests.filter((x) => once.questsPaid.includes(x.id)).reduce((s, x) => s + x.reward, 0));
    expect(payQuests(once, quests, world)).toEqual(once);
  });
});
