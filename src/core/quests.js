import { addCoins } from './wallet.js';
import { itemInSlot, lairOf } from './lair.js';
import { currentLevel } from './dragon.js';

// Pure, and fed everything it needs. `world` carries the catalogues ({ furniture, slots,
// dragons }) because core never imports data; the quests themselves are passed in the same way.

// Stages climbed by one dragon: 0 at its first stage, `levels.length - 1` at its last.
const stagesClimbed = (dragon, xp) => {
  const at = currentLevel(dragon, xp);
  return dragon.levels.indexOf(at);
};

// The furthest any single dragon has grown. A quest asks for "a dragon", never the sum of
// several, so growing a second one adds nothing here.
const bestGrowth = (state, dragons) =>
  Math.max(0, ...dragons.map((d) => stagesClimbed(d, state.xpByDragon?.[d.id] ?? 0)));

const lastStage = (dragons) => Math.max(0, ...dragons.map((d) => d.levels.length - 1));

// Slots filled in one lair, by the same read-time rule the room uses: a stale or misplaced
// id does not count as a decoration.
const filledSlots = (lair, { furniture, slots }) =>
  slots.filter((slot) => itemInSlot(lair, furniture, slot)).length;

const fullestRoom = (state, world) =>
  Math.max(0, ...Object.keys(state.lairs ?? {}).map((id) => filledSlots(lairOf(state, id), world)));

// A quest's `stage` is a stage index (1 baby, 2 young) or 'last', which each creature
// resolves against its own levels, so a creature with fewer stages still counts as grown.
const stageIndex = (dragon, stage) => (stage === 'last' ? dragon.levels.length - 1 : stage);

const reachedStage = (dragon, state, stage) =>
  stagesClimbed(dragon, state.xpByDragon?.[dragon.id] ?? 0) >= stageIndex(dragon, stage);

const inFamily = (dragons, family) => (family ? dragons.filter((d) => d.family === family) : dragons);

const creaturesAt = (state, { stage, family }, dragons) =>
  inFamily(dragons, family).filter((d) => reachedStage(d, state, stage)).length;

const familiesOf = (dragons) => [...new Set(dragons.map((d) => d.family))];

const familiesAt = (state, { stage }, dragons) =>
  familiesOf(dragons).filter((f) => inFamily(dragons, f).some((d) => reachedStage(d, state, stage))).length;

// Every lair the save holds, read through `lairOf` so a missing field reads as empty. When the
// quest names a family, only lairs of creatures in that family count.
const lairsIn = (state, dragons, family) => {
  const ids = Object.keys(state.lairs ?? {});
  const kept = family ? ids.filter((id) => inFamily(dragons, family).some((d) => d.id === id)) : ids;
  return kept.map((id) => lairOf(state, id));
};

const sum = (values) => values.reduce((a, b) => a + b, 0);

const placedDecorations = (state, world) => sum(lairsIn(state, world.dragons).map((l) => filledSlots(l, world)));

const fullRooms = (state, world, family) =>
  lairsIn(state, world.dragons, family).filter((l) => filledSlots(l, world) === world.slots.length).length;

const petsPlaced = (state, world) =>
  lairsIn(state, world.dragons).filter((l) => world.slots.some((slot) => itemInSlot(l, world.furniture, slot)?.pet)).length;

// Owned items still in the catalogue, each counted once per lair.
const itemsOwned = (state, world) => sum(lairsIn(state, world.dragons).map((l) =>
  new Set((l.owned ?? []).filter((id) => world.furniture.some((i) => i.id === id))).size));

const measure = (quest, state, world) => {
  switch (quest.kind) {
    case 'blocks': return state.lifetimeBlocks ?? 0;
    case 'lair': return state.lairUnlocked ? 1 : 0;
    case 'decorations': return Math.min(1, fullestRoom(state, world));
    case 'fullRoom': return fullestRoom(state, world);
    case 'growing': return Math.min(1, bestGrowth(state, world.dragons));
    case 'fullGrown': return bestGrowth(state, world.dragons);
    case 'reached': return creaturesAt(state, quest, world.dragons);
    case 'everyFamily': return familiesAt(state, quest, world.dragons);
    case 'placed': return placedDecorations(state, world);
    case 'fullRooms': return fullRooms(state, world, quest.family);
    case 'pets': return petsPlaced(state, world);
    case 'owned': return itemsOwned(state, world);
    default: return 0;
  }
};

// A `null` goal is resolved from the catalogue: the last growth stage, or every family.
const goalOf = (quest, world) => {
  if (quest.kind === 'fullGrown') return lastStage(world.dragons);
  if (quest.kind === 'everyFamily') return familiesOf(world.dragons).length;
  return quest.goal;
};

/**
 * How far one quest has come. `current` is capped at `goal`, so a finished quest reads
 * "10 / 10" however far past it she went, and nothing here can read as a shortfall.
 * @returns {{current: number, goal: number, done: boolean}}
 */
export const questProgress = (quest, state, world) => {
  const goal = goalOf(quest, world);
  const raw = measure(quest, state, world);
  return { current: Math.min(raw, goal), goal, done: raw >= goal };
};

// Every quest the state satisfies, whether or not it has been paid yet.
export const satisfiedQuests = (quests, state, world) =>
  quests.filter((q) => questProgress(q, state, world).done);

/**
 * Pay each satisfied quest that is not already in `questsPaid`, once and only once.
 * The paid list is the guard: coins get spent, so the purse can never say what was paid.
 * Running it again on its own result changes nothing, so callers may run it after any change.
 */
export const payQuests = (state, quests, world) => {
  const paid = state.questsPaid ?? [];
  const due = satisfiedQuests(quests, state, world).filter((q) => !paid.includes(q.id));
  if (due.length === 0) return state;
  return {
    ...state,
    coins: due.reduce((coins, q) => addCoins(coins, q.reward), state.coins),
    questsPaid: [...paid, ...due.map((q) => q.id)],
  };
};
