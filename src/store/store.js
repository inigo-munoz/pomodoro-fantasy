import { totalBlocks } from '../core/history.js';
import { defaultWeekly } from '../core/weekly.js';
import { deviceLanguage as readDeviceLanguage } from '../i18n/i18n.js';

// `language` is the device's on a new game; the store passes it in, so this stays pure.
export const defaultState = (config, language = 'en') => ({
  version: 7,
  dragonId: null,
  coins: 0,
  xpByDragon: {},
  lairs: {},
  lairUnlocked: false,
  history: {},
  // Every work block ever finished. Unlike `history` it is never pruned, so it only grows.
  lifetimeBlocks: 0,
  // Ids of the quests already paid. Coins get spent, so the purse cannot say what was paid;
  // this list is the only thing that stops a quest from paying twice.
  questsPaid: [],
  // This week's three quests, what they paid, and the two counters history cannot answer.
  // Rolled over every Monday by core/weekly.js; `week` is null until the first draw.
  weekly: defaultWeekly(),
  muted: false,
  settings: { ...config.durations.default, musicStyle: config.musicStyles[0], language },
  timer: null,
});

// The lair slot once called `corner` sits at the bottom centre, so v4 renamed it `center`.
// A saved lair keys its placed items by slot id, so without this move the pet a child had
// placed would stay owned but vanish from her room.
const renameCornerSlot = (lairs) => {
  const next = {};
  for (const [dragonId, lair] of Object.entries(lairs ?? {})) {
    if (!lair?.slots || !('corner' in lair.slots)) { next[dragonId] = lair; continue; }
    const { corner, ...slots } = lair.slots;
    next[dragonId] = { ...lair, slots: { center: corner, ...slots } };
  }
  return next;
};

const cleanWeekly = (weekly) => {
  const empty = defaultWeekly();
  if (weekly === null || typeof weekly !== 'object' || Array.isArray(weekly)) return empty;
  const list = (v) => (Array.isArray(v) ? v : []);
  const count = (v) => (Number.isFinite(v) ? v : 0);
  return {
    week: typeof weekly.week === 'string' ? weekly.week : null,
    ids: list(weekly.ids),
    paid: list(weekly.paid),
    foods: count(weekly.foods),
    items: count(weekly.items),
  };
};

// Upgrade older saves to the current shape. v1 (global `xp`) becomes the
// per-dragon `xpByDragon`; v2 gains `timer`, which the defaults merge fills in; v3 lairs
// move their `corner` slot to `center`; v4 saves gain `lifetimeBlocks`, seeded from the
// history they still hold; v5 saves gain `questsPaid`; v6 saves gain `weekly`.
const migrate = (merged, parsed) => {
  let next = merged;
  if ('xp' in parsed) {
    const xpByDragon = parsed.dragonId ? { [parsed.dragonId]: parsed.xp ?? 0 } : {};
    const { xp, ...rest } = merged;
    next = { ...rest, xpByDragon };
  }
  if ((parsed.version ?? 0) < 4) next = { ...next, lairs: renameCornerSlot(next.lairs) };
  // The defaults merge would hand an older save 0, and the total would drop to nothing. The
  // history it still holds is the best honest estimate; whatever was pruned is gone for good.
  if ((parsed.version ?? 0) < 5 && !Number.isFinite(parsed.lifetimeBlocks)) {
    next = { ...next, lifetimeBlocks: totalBlocks(parsed.history) };
  }
  // A counter that is not a finite number would turn "5" + 1 into "51". It becomes 0 and is
  // NOT reseeded from history, for every version: a save that already paid quests would
  // otherwise count the pruned-and-kept days twice.
  if (!Number.isFinite(next.lifetimeBlocks)) next = { ...next, lifetimeBlocks: 0 };
  // Empty is the honest default for an old save: the quests it has already earned then pay
  // out once, at the next payout. The list is checked rather than trusted, since a value that
  // is not a list would make every later `includes` throw.
  if (!Array.isArray(next.questsPaid)) next = { ...next, questsPaid: [] };
  // `weekly` gets the same distrust as `questsPaid`: each part is checked, and a bad one falls
  // back to its default rather than throw later. It never touches `questsPaid`.
  next = { ...next, weekly: cleanWeekly(next.weekly) };
  return { ...next, version: 7 };
};

// --- hardening -------------------------------------------------------------------------
// The save comes from storage, which can be damaged, or from a backup file anyone can edit.
// Every field is checked here, after migration, so the rest of the app can trust its types:
// a value that is not what it should be falls back to its default instead of breaking the app
// (a string in `coins` turns 50 + 7 into "507"; an inherited name like "constructor" as a
// music style crashes start-up; a string in `muted` used to reach the page as markup).
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const count = (v, fallback = 0) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback);
const inRange = (v, { min, max }, fallback) => (Number.isFinite(v) && v >= min && v <= max ? v : fallback);
const entries = (v) => (isPlainObject(v) ? Object.entries(v).filter(([k]) => !UNSAFE_KEYS.has(k)) : []);
const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const TIMER_MODES = new Set(['work', 'break', 'longBreak']);

const cleanSettings = (settings, config, defaults) => {
  const { customRange, sessionsRange } = config.durations;
  const s = isPlainObject(settings) ? settings : {};
  return {
    ...defaults,
    workMinutes: inRange(s.workMinutes, customRange, defaults.workMinutes),
    breakMinutes: inRange(s.breakMinutes, customRange, defaults.breakMinutes),
    longBreakMinutes: inRange(s.longBreakMinutes, customRange, defaults.longBreakMinutes),
    sessionsBeforeLongBreak: inRange(s.sessionsBeforeLongBreak, sessionsRange, defaults.sessionsBeforeLongBreak),
    musicStyle: config.musicStyles.includes(s.musicStyle) ? s.musicStyle : defaults.musicStyle,
    language: config.languages.includes(s.language) ? s.language : defaults.language,
  };
};

const cleanLairs = (lairs) => Object.fromEntries(entries(lairs)
  .filter(([, lair]) => isPlainObject(lair))
  // A field the lair never had stays absent; one that is present but wrong is emptied.
  .map(([id, lair]) => [id, {
    ...lair,
    ...('owned' in lair ? { owned: strings(lair.owned) } : {}),
    ...('slots' in lair
      ? { slots: Object.fromEntries(entries(lair.slots).filter(([, item]) => typeof item === 'string')) }
      : {}),
  }]));

const cleanHistory = (history) => Object.fromEntries(entries(history)
  .filter(([day, d]) => DAY_KEY.test(day) && isPlainObject(d) && Number.isFinite(d.blocks) && d.blocks >= 0)
  .map(([day, d]) => [day, { blocks: count(d.blocks), minutes: count(d.minutes) }]));

// Only the fields the app persists (see persistTimer in app.js); anything else is no timer.
const cleanTimer = (t) => {
  if (!isPlainObject(t) || !TIMER_MODES.has(t.mode) || typeof t.running !== 'boolean') return null;
  if (!Number.isFinite(t.remaining) || t.remaining < 0) return null;
  if (t.endsAt !== null && t.endsAt !== undefined && !Number.isFinite(t.endsAt)) return null;
  // Fields an older save never wrote stay absent: the timer fills them from its own defaults.
  return {
    mode: t.mode, running: t.running, remaining: t.remaining, endsAt: t.endsAt ?? null,
    ...('completedWork' in t ? { completedWork: count(t.completedWork) } : {}),
    ...('roundComplete' in t ? { roundComplete: t.roundComplete === true } : {}),
  };
};

const harden = (state, config, language) => {
  const defaults = defaultState(config, language);
  return {
    ...state,
    dragonId: typeof state.dragonId === 'string' ? state.dragonId : null,
    coins: count(state.coins),
    // Only a real `true` mutes: a string like "false" from a hand-edited file must not.
    muted: state.muted === true,
    lairUnlocked: state.lairUnlocked === true,
    xpByDragon: Object.fromEntries(entries(state.xpByDragon).filter(([, xp]) => Number.isFinite(xp) && xp >= 0)),
    lairs: cleanLairs(state.lairs),
    history: cleanHistory(state.history),
    lifetimeBlocks: count(state.lifetimeBlocks),
    questsPaid: strings(state.questsPaid),
    settings: cleanSettings(state.settings, config, defaults.settings),
    timer: state.timer === null ? null : cleanTimer(state.timer),
  };
};

// `deviceLanguage` is the seam for the first language of a save that has none: the device's
// own by default, any function in tests.
export const createStore = (backend, config, { deviceLanguage = readDeviceLanguage } = {}) => {
  const key = config.storageKey;
  // One path from a parsed save to a state, for storage and for a restored backup alike.
  const fromSave = (parsed) => {
    const language = deviceLanguage();
    const defaults = defaultState(config, language);
    // The merge is shallow, so a saved `settings` would replace the defaults wholesale
    // and drop any setting added since it was written. Merge that one level too.
    if (!isPlainObject(parsed)) return defaults;
    const settings = { ...defaults.settings, ...(isPlainObject(parsed.settings) ? parsed.settings : {}) };
    return harden(migrate({ ...defaults, ...parsed, settings }, parsed), config, language);
  };
  return {
    save: (state) => backend.write(key, JSON.stringify(state)),
    fromSave,
    // Before a restore replaces the game, the game as it was is kept aside, so a wrong file
    // never costs a child her progress for good.
    keepPrevious: () => {
      const raw = backend.read(key);
      if (raw) backend.write(`${key}.previous`, raw);
    },
    load: () => {
      const raw = backend.read(key);
      if (!raw) return defaultState(config, deviceLanguage());
      try {
        return fromSave(JSON.parse(raw));
      } catch {
        // A save that cannot be read would be overwritten by the next write. Keep its text.
        try { backend.write(`${key}.corrupt`, raw); } catch { /* storage full: nothing more to do */ }
        return defaultState(config, deviceLanguage());
      }
    },
  };
};
