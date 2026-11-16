import { describe, it, expect } from 'vitest';
import { createStore, defaultState } from './store.js';
import { config } from '../data/config.js';
import { existsSync } from 'node:fs';

const memoryBackend = () => {
  const box = {};
  return {
    read: (k) => (k in box ? box[k] : null),
    write: (k, v) => { box[k] = v; },
  };
};

describe('store', () => {
  it('returns default state when nothing is saved', () => {
    const store = createStore(memoryBackend(), config);
    const s = store.load();
    expect(s.coins).toBe(0);
    expect(s.xpByDragon).toEqual({});
    expect(s.version).toBe(7);
    expect(s.timer).toBeNull();
    expect(s.dragonId).toBeNull();
    expect(s.settings).toEqual({ ...config.durations.default, musicStyle: 'cozy', language: 'en' });
  });

  it('save then load returns the same state (roundtrip)', () => {
    const store = createStore(memoryBackend(), config);
    const saved = { ...defaultState(config), dragonId: 'frost', coins: 40,
      xpByDragon: { frost: 120 } };
    store.save(saved);
    expect(store.load()).toEqual(saved);
  });

  it('migrates a v1 save (global xp) to per-dragon xpByDragon', () => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify(
      { version: 1, dragonId: 'frost', coins: 40, xp: 120, muted: false,
        settings: config.durations.default }));
    const store = createStore(backend, config);
    const s = store.load();
    expect(s.version).toBe(7);
    expect(s.xpByDragon).toEqual({ frost: 120 });
    expect(s.coins).toBe(40);
    expect('xp' in s).toBe(false);
  });

  it('loads an old save without a timer field with timer null and the new version', () => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify(
      { version: 2, dragonId: 'frost', coins: 5, xpByDragon: { frost: 10 }, muted: false,
        settings: config.durations.default }));
    const s = createStore(backend, config).load();
    expect(s.timer).toBeNull();
    expect(s.version).toBe(7);
    expect(s.coins).toBe(5);
  });

  it('round-trips a persisted timer through save and load', () => {
    const store = createStore(memoryBackend(), config);
    const timer = { mode: 'work', running: true, remaining: 90, endsAt: 1_700_000_000_000 };
    store.save({ ...defaultState(config), timer });
    expect(store.load().timer).toEqual(timer);
  });

  it('falls back to defaults when stored data is corrupt', () => {
    const backend = memoryBackend();
    backend.write(config.storageKey, '{not valid json');
    const store = createStore(backend, config);
    expect(store.load().coins).toBe(0);
  });
});

describe('store lairs field', () => {
  it('defaults lairs to an empty object at the current version', () => {
    expect(defaultState(config).lairs).toEqual({});
    expect(defaultState(config).version).toBe(7);
  });

  it('loads an old save without lairs, keeping every other field intact', () => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify(
      { version: 3, dragonId: 'frost', coins: 5, xpByDragon: { frost: 10 }, muted: false,
        settings: config.durations.default, timer: null }));
    const s = createStore(backend, config).load();
    expect(s.lairs).toEqual({});
    expect(s.version).toBe(7);
    expect(s.coins).toBe(5);
    expect(s.xpByDragon).toEqual({ frost: 10 });
  });
});

describe('lair unlock state', () => {
  it('defaults to locked with the current version and exactly two new keys', () => {
    const s = defaultState(config);
    expect(s.lairUnlocked).toBe(false);
    expect(s.lairs).toEqual({});
    expect(s.version).toBe(7);
  });

  it('prices the unlock in config, as data', () => {
    expect(config.lairUnlockPrice).toBe(50);
  });

  it('loads a v3 save with neither lairs nor lairUnlocked as locked, other fields intact', () => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify(
      { version: 3, dragonId: 'frost', coins: 500, xpByDragon: { frost: 80 },
        muted: false, settings: config.durations.default, timer: null }));
    const s = createStore(backend, config).load();
    expect(s.lairUnlocked).toBe(false);
    expect(s.lairs).toEqual({});
    expect(s.coins).toBe(500);
    expect(s.xpByDragon).toEqual({ frost: 80 });
    expect(s.version).toBe(7);
  });

  it('keeps an unlocked flag across save and load', () => {
    const store = createStore(memoryBackend(), config);
    store.save({ ...defaultState(config), lairUnlocked: true });
    expect(store.load().lairUnlocked).toBe(true);
  });
});

describe('music style setting', () => {
  it('defaults to cozy, beside the durations, at the current version', () => {
    const s = defaultState(config);
    expect(s.settings).toEqual({
      workMinutes: 15, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4,
      musicStyle: 'cozy', language: 'en',
    });
    expect(s.version).toBe(7);
  });

  it('loads a save written before the setting existed with the default and loses nothing', () => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify({
      version: 3, dragonId: 'frost', coins: 42, muted: true,
      settings: { workMinutes: 25, breakMinutes: 10 },
    }));
    const s = createStore(backend, config).load();
    expect(s.settings).toEqual({
      workMinutes: 25, breakMinutes: 10, longBreakMinutes: 15, sessionsBeforeLongBreak: 4,
      musicStyle: 'cozy', language: 'en',
    });
    expect(s.dragonId).toBe('frost');
    expect(s.coins).toBe(42);
    expect(s.muted).toBe(true);
  });

  it('keeps a chosen style across save and load', () => {
    const store = createStore(memoryBackend(), config);
    const state = defaultState(config);
    store.save({ ...state, settings: { ...state.settings, musicStyle: 'lofi' } });
    expect(store.load().settings.musicStyle).toBe('lofi');
  });
});

describe('music playlists in config', () => {
  it('has a playlist for every offered style', () => {
    expect(config.musicStyles).toEqual(['cozy', 'lofi', 'enchanted', 'nature']);
    for (const style of config.musicStyles) {
      expect(config.music[style].length).toBeGreaterThan(0);
    }
  });

  // A playlist path that does not exist plays nothing at all, silently: check the files.
  it('ships every track of every style on disk', () => {
    for (const style of config.musicStyles) {
      for (const path of config.music[style]) expect(existsSync(`public${path}`), path).toBe(true);
    }
  });

  it('ships every sound effect on disk', () => {
    expect(Object.keys(config.effects).sort()).toEqual(['bell', 'chitter', 'levelup', 'purr', 'quest']);
    for (const path of Object.values(config.effects)) expect(existsSync(`public${path}`), path).toBe(true);
  });
});

describe('long break settings', () => {
  it('fills the cycle defaults into a realistic save from before they existed', () => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify({
      version: 3, dragonId: 'ember', coins: 130, muted: false,
      xpByDragon: { ember: 240 },
      lairUnlocked: true,
      lairs: { ember: { owned: ['cushion'], placed: { floorLeft: 'cushion' } } },
      settings: { workMinutes: 20, breakMinutes: 4, musicStyle: 'lofi' },
      timer: { mode: 'break', running: false, remaining: 120, endsAt: null },
    }));
    const s = createStore(backend, config).load();
    expect(s.settings).toEqual({
      workMinutes: 20, breakMinutes: 4, musicStyle: 'lofi',
      longBreakMinutes: 15, sessionsBeforeLongBreak: 4, language: 'en',
    });
    expect(s.version).toBe(7);
    expect(s.dragonId).toBe('ember');
    expect(s.coins).toBe(130);
    expect(s.xpByDragon).toEqual({ ember: 240 });
    expect(s.lairUnlocked).toBe(true);
    expect(s.lairs.ember.owned).toEqual(['cushion']);
    expect(s.timer).toEqual({ mode: 'break', running: false, remaining: 120, endsAt: null });
  });

  it('keeps a saved cycle setting over the default', () => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify({
      version: 3, settings: { longBreakMinutes: 10, sessionsBeforeLongBreak: 2 },
    }));
    const s = createStore(backend, config).load();
    expect(s.settings.longBreakMinutes).toBe(10);
    expect(s.settings.sessionsBeforeLongBreak).toBe(2);
    expect(s.settings.workMinutes).toBe(15);
  });
});

describe('store history field', () => {
  it('defaults history to an empty object at the current version', () => {
    expect(defaultState(config).history).toEqual({});
    expect(defaultState(config).version).toBe(7);
  });

  it('loads a realistic save from before the record existed, gaining history and losing nothing', () => {
    const backend = memoryBackend();
    const old = {
      version: 3, dragonId: 'blaze', coins: 37, xpByDragon: { blaze: 240, frost: 90 },
      lairs: { blaze: { owned: ['bed'], slots: { floorLeft: 'bed' } } },
      lairUnlocked: true, muted: true,
      settings: { ...config.durations.default, workMinutes: 20, musicStyle: 'lofi' },
      timer: { mode: 'break', running: false, remaining: 120, endsAt: null, completedWork: 2 },
    };
    backend.write(config.storageKey, JSON.stringify(old));
    const s = createStore(backend, config).load();
    expect(s.history).toEqual({});
    expect(s).toEqual({ ...old, version: 7, history: {}, lifetimeBlocks: 0, questsPaid: [],
      settings: { ...old.settings, language: 'en' },
      weekly: { week: null, ids: [], paid: [], foods: 0, items: 0 } });
  });

  it('round-trips a saved history', () => {
    const store = createStore(memoryBackend(), config);
    const history = { '2026-10-02': { blocks: 3, minutes: 75 } };
    store.save({ ...defaultState(config), history });
    expect(store.load().history).toEqual(history);
  });
});

describe('the center slot was once called corner', () => {
  const load = (save) => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify(save));
    return createStore(backend, config).load();
  };
  const settings = config.durations.default;

  it('moves a placed pet from corner to center, losing nothing else', () => {
    const old = {
      version: 3, dragonId: 'frost', coins: 12, xpByDragon: { frost: 80 }, lairUnlocked: true,
      lairs: { frost: { owned: ['imp', 'bed', 'banner'],
        slots: { wall: 'banner', floorLeft: 'bed', corner: 'imp' } } },
      muted: false, settings, timer: null, history: {},
    };
    const s = load(old);
    expect(s.lairs.frost.slots).toEqual({ wall: 'banner', floorLeft: 'bed', center: 'imp' });
    expect('corner' in s.lairs.frost.slots).toBe(false);
    expect(s.lairs.frost.owned).toEqual(['imp', 'bed', 'banner']);
    expect(s.version).toBe(7);
    expect(s.coins).toBe(12);
    expect(s.xpByDragon).toEqual({ frost: 80 });
  });

  it('migrates every dragon that has a decorated lair', () => {
    const s = load({
      version: 3, dragonId: 'frost',
      lairs: {
        frost: { owned: ['imp'], slots: { corner: 'imp' } },
        ember: { owned: ['bird', 'bed'], slots: { corner: 'bird', floorRight: 'bed' } },
      },
    });
    expect(s.lairs.frost).toEqual({ owned: ['imp'], slots: { center: 'imp' } });
    expect(s.lairs.ember).toEqual({ owned: ['bird', 'bed'],
      slots: { center: 'bird', floorRight: 'bed' } });
  });

  it('leaves a lair with no corner untouched', () => {
    const lair = { owned: ['bed'], slots: { floorLeft: 'bed' } };
    expect(load({ version: 3, lairs: { frost: lair } }).lairs.frost).toEqual(lair);
  });

  it('does not throw on a lair with no slots, and keeps it', () => {
    expect(load({ version: 3, lairs: { frost: { owned: ['bed'] } } }).lairs.frost)
      .toEqual({ owned: ['bed'] });
  });

  it('does not throw on a save with no lairs', () => {
    const s = load({ version: 3, dragonId: 'frost', coins: 5 });
    expect(s.lairs).toEqual({});
    expect(s.coins).toBe(5);
  });

  it('does not touch a current save that already uses center', () => {
    const lair = { owned: ['imp'], slots: { center: 'imp' } };
    expect(load({ version: 4, lairs: { frost: lair } }).lairs.frost).toEqual(lair);
  });
});

describe('store lifetime blocks', () => {
  const load = (save) => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify(save));
    return createStore(backend, config).load();
  };

  it('starts a new save at zero', () => {
    expect(defaultState(config).lifetimeBlocks).toBe(0);
  });

  it('seeds the counter from the history a pre-counter save still has', () => {
    const s = load({
      version: 4, dragonId: 'frost',
      history: { '2026-09-01': { blocks: 4, minutes: 100 }, '2026-10-02': { blocks: 3, minutes: 75 } },
    });
    expect(s.lifetimeBlocks).toBe(7);
    expect(s.version).toBe(7);
  });

  it('keeps a counter that is already there and does not reseed it from the history', () => {
    const s = load({
      version: 5, history: { '2026-10-02': { blocks: 3, minutes: 75 } }, lifetimeBlocks: 130,
    });
    expect(s.lifetimeBlocks).toBe(130);
  });

  it('keeps an existing counter even on a save still labelled with an older version', () => {
    expect(load({ version: 4, history: { a: { blocks: 3, minutes: 1 } }, lifetimeBlocks: 130 })
      .lifetimeBlocks).toBe(130);
  });

  it('gives a save with no history at all a zero counter, without throwing', () => {
    expect(load({ version: 4, dragonId: 'frost', coins: 5 }).lifetimeBlocks).toBe(0);
    expect(load({ version: 4, history: null }).lifetimeBlocks).toBe(0);
  });
});

describe('store: a corrupt save cannot wipe the rest', () => {
  const load = (save) => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify(save));
    return createStore(backend, config).load();
  };

  it('keeps every field of a v3 save that has a null day and a string day', () => {
    const s = load({
      version: 3, dragonId: 'frost', coins: 42, xp: 90,
      lairs: { frost: { owned: ['imp'], slots: { corner: 'imp' } } },
      history: {
        '2026-09-01': { blocks: 4, minutes: 100 },
        '2026-09-02': null,
        '2026-09-03': 'oops',
        '2026-10-02': { blocks: 3, minutes: 75 },
      },
    });
    expect(s.dragonId).toBe('frost');
    expect(s.coins).toBe(42);
    expect(s.xpByDragon).toEqual({ frost: 90 });
    expect(s.lairs.frost.slots).toEqual({ center: 'imp' });
    expect(s.lifetimeBlocks).toBe(7);
    expect(s.version).toBe(7);
  });

  it.each([null, 'text', 7, [], [null, 'x'], { a: { b: { blocks: 9 } } }, { a: { blocks: 'x' } }])(
    'never throws for a history shaped like %j', (history) => {
      const s = load({ version: 4, dragonId: 'frost', coins: 5, history });
      expect(s.coins).toBe(5);
      expect(s.lifetimeBlocks).toBe(0);
    },
  );

  it('coerces a string lifetimeBlocks on a current save so it cannot concatenate', () => {
    const s = load({ version: 6, coins: 5, lifetimeBlocks: '5' });
    expect(s.lifetimeBlocks).toBe(0);
    expect(s.coins).toBe(5);
  });

  it.each([null, NaN, 'x', {}, Infinity])('turns lifetimeBlocks %j into 0 on a v6 save', (v) => {
    expect(load({ version: 6, lifetimeBlocks: v }).lifetimeBlocks).toBe(0);
  });

  it('keeps a valid lifetimeBlocks on a current save', () => {
    expect(load({ version: 6, lifetimeBlocks: 12 }).lifetimeBlocks).toBe(12);
  });
});

describe('store: quests paid', () => {
  const load = (saved) => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify(saved));
    return createStore(backend, config).load();
  };

  it('starts a new save with nothing paid', () => {
    expect(defaultState(config).questsPaid).toEqual([]);
  });

  it('gives an old save an empty list and loses nothing else', () => {
    const old = {
      version: 5, dragonId: 'blaze', coins: 37, xpByDragon: { blaze: 240 }, lifetimeBlocks: 128,
      lairUnlocked: true, lairs: { blaze: { owned: ['bed'], slots: { floorLeft: 'bed' } } },
      history: { '2026-10-02': { blocks: 3, minutes: 75 } }, muted: true,
    };
    const s = load(old);
    expect(s.questsPaid).toEqual([]);
    expect(s.version).toBe(7);
    expect(s).toMatchObject({ ...old, version: 7 });
  });

  it('keeps the ids a save already holds', () => {
    expect(load({ version: 6, questsPaid: ['blocks-1', 'lair-open'] }).questsPaid)
      .toEqual(['blocks-1', 'lair-open']);
  });

  it('replaces a list that is not a list with an empty one, rather than crash on it', () => {
    expect(load({ version: 5, questsPaid: 'blocks-1' }).questsPaid).toEqual([]);
    expect(load({ version: 6, questsPaid: null }).questsPaid).toEqual([]);
  });
});

// A restored backup goes through the same path as a load from storage, so an old save from a
// file is migrated and filled in exactly as the same save would be on start-up.
describe('store.fromSave', () => {
  it('gives the same state as loading that save from storage', () => {
    const old = { dragonId: 'frost', xp: 640, coins: 12, settings: { workMinutes: 25 } };
    const backend = memoryBackend();
    const store = createStore(backend, config);
    backend.write(config.storageKey, JSON.stringify(old));
    expect(store.fromSave(old)).toEqual(store.load());
  });

  it('does not write anything', () => {
    const backend = memoryBackend();
    createStore(backend, config).fromSave({ dragonId: 'frost', coins: 3 });
    expect(backend.read(config.storageKey)).toBeNull();
  });
});

describe('store weekly quests (v7)', () => {
  const load = (save) => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify(save));
    return createStore(backend, config).load();
  };
  const emptyWeekly = { week: null, ids: [], paid: [], foods: 0, items: 0 };

  it('defaults to no week drawn yet and zero counters, at version 7', () => {
    expect(defaultState(config).version).toBe(7);
    expect(defaultState(config).weekly).toEqual(emptyWeekly);
  });

  it('loads a v6 save with every field intact and a default weekly', () => {
    const old = {
      version: 6, dragonId: 'blaze', coins: 37, xpByDragon: { blaze: 240 },
      lairs: { blaze: { owned: ['bed'], slots: { floorLeft: 'bed' } } },
      lairUnlocked: true, muted: true,
      history: { '2026-11-16': { blocks: 3, minutes: 45 } }, lifetimeBlocks: 130,
      questsPaid: ['blocks-1', 'lair-open'],
      settings: { ...config.durations.default, workMinutes: 20, musicStyle: 'lofi' },
      timer: { mode: 'break', running: false, remaining: 120, endsAt: null, completedWork: 2 },
    };
    expect(load(old)).toEqual({ ...old, version: 7, settings: { ...old.settings, language: 'en' }, weekly: emptyWeekly });
  });

  it('round-trips a v7 save with its weekly state', () => {
    const store = createStore(memoryBackend(), config);
    const weekly = { week: '2026-11-16', ids: ['a', 'b', 'c'], paid: ['a'], foods: 2, items: 1 };
    const state = { ...defaultState(config), coins: 12, weekly };
    store.save(state);
    expect(store.load()).toEqual(state);
  });

  it('replaces a weekly that is not an object, and fills missing parts, rather than crash on it', () => {
    expect(load({ version: 7, weekly: null }).weekly).toEqual(emptyWeekly);
    expect(load({ version: 7, weekly: 'x' }).weekly).toEqual(emptyWeekly);
    expect(load({ version: 7, weekly: { week: '2026-11-16', ids: 'a', paid: null, foods: '3' } }).weekly)
      .toEqual({ ...emptyWeekly, week: '2026-11-16' });
  });
});

// A restored backup is a file anyone can edit, and the save on disk can be damaged. Every field
// is checked on the way in: a bad value falls back to its default instead of breaking the app.
describe('store.fromSave hardening', () => {
  const store = () => createStore(memoryBackend(), config);
  const clean = (save) => store().fromSave(save);
  const defaults = () => defaultState(config);

  it('keeps a realistic save exactly as it is', () => {
    const save = {
      ...defaults(), dragonId: 'frost', coins: 230, muted: true, lairUnlocked: true,
      xpByDragon: { frost: 900, blaze: 40 }, lifetimeBlocks: 140, questsPaid: ['blocks-1'],
      lairs: { frost: { owned: ['bed', 'lamp'], slots: { floorLeft: 'bed', floorRight: 'lamp' } } },
      history: { '2026-11-15': { blocks: 3, minutes: 45 } },
      settings: { ...defaults().settings, workMinutes: 25, musicStyle: 'lofi' },
      timer: { mode: 'break', running: true, remaining: 120, endsAt: 1763200000000, completedWork: 2, roundComplete: false },
    };
    expect(clean(save)).toEqual(save);
  });

  it('turns a muted flag that is not a boolean into a boolean', () => {
    expect(clean({ muted: '"><img src=x onerror=alert(1)>' }).muted).toBe(false);
    expect(clean({ muted: true }).muted).toBe(true);
    expect(clean({ muted: 0 }).muted).toBe(false);
    expect(clean({ muted: 'false' }).muted).toBe(false);
  });

  it('keeps coins a whole number of at least zero', () => {
    expect(clean({ coins: '50' }).coins).toBe(0);
    expect(clean({ coins: -5 }).coins).toBe(0);
    expect(clean({ coins: 12.7 }).coins).toBe(12);
    expect(clean({ coins: null }).coins).toBe(0);
  });

  it('only accepts a music style the app offers, never an inherited name', () => {
    expect(clean({ settings: { musicStyle: 'constructor' } }).settings.musicStyle).toBe(config.musicStyles[0]);
    expect(clean({ settings: { musicStyle: 'toString' } }).settings.musicStyle).toBe(config.musicStyles[0]);
  });

  it('puts durations back to their defaults when they are not numbers in range', () => {
    const d = defaults().settings;
    const s = clean({ settings: { workMinutes: null, breakMinutes: '5', longBreakMinutes: 999, sessionsBeforeLongBreak: 0 } }).settings;
    expect(s.workMinutes).toBe(d.workMinutes);
    expect(s.breakMinutes).toBe(d.breakMinutes);
    expect(s.longBreakMinutes).toBe(d.longBreakMinutes);
    expect(s.sessionsBeforeLongBreak).toBe(d.sessionsBeforeLongBreak);
  });

  it('keeps only well-formed creature xp, lairs and history days', () => {
    const s = clean({
      dragonId: 42,
      xpByDragon: { frost: 300, bad: 'x', neg: -1 },
      lairs: { frost: { owned: 'abc', slots: null }, ok: { owned: ['bed', 3], slots: { floorLeft: 'bed', wall: 7 } }, junk: 'x' },
      history: null,
      lairUnlocked: 'yes',
      questsPaid: ['blocks-1', 5],
    });
    expect(s.dragonId).toBeNull();
    expect(s.xpByDragon).toEqual({ frost: 300 });
    expect(s.lairs).toEqual({ frost: { owned: [], slots: {} }, ok: { owned: ['bed'], slots: { floorLeft: 'bed' } } });
    expect(s.history).toEqual({});
    expect(s.lairUnlocked).toBe(false);
    expect(s.questsPaid).toEqual(['blocks-1']);
    expect(clean({ history: { '2026-11-15': { blocks: 2, minutes: 30 }, nope: 3, '2026-11-14': { blocks: 'x' } } }).history)
      .toEqual({ '2026-11-15': { blocks: 2, minutes: 30 } });
  });

  it('drops a timer that is not a timer', () => {
    expect(clean({ timer: { mode: 'party', running: true } }).timer).toBeNull();
    expect(clean({ timer: 'x' }).timer).toBeNull();
    expect(clean({ timer: { mode: 'work', running: true, remaining: 'x', endsAt: 0 } }).timer).toBeNull();
  });

  it('ignores __proto__ and constructor keys without polluting anything', () => {
    const s = clean(JSON.parse('{"xpByDragon":{"__proto__":{"polluted":1},"frost":5},"lairs":{"constructor":{"owned":[]}}}'));
    expect(({}).polluted).toBeUndefined();
    expect(s.xpByDragon).toEqual({ frost: 5 });
    expect(Object.keys(s.lairs)).toEqual([]);
  });
});

describe('store keeps what it would otherwise lose', () => {
  it('keeps a save it cannot read under a separate key, and loads a new game', () => {
    const backend = memoryBackend();
    backend.write(config.storageKey, '{broken');
    const state = createStore(backend, config).load();
    expect(state).toEqual(defaultState(config));
    expect(backend.read(`${config.storageKey}.corrupt`)).toBe('{broken');
  });

  it('keeps the current save under a separate key before it is replaced', () => {
    const backend = memoryBackend();
    backend.write(config.storageKey, '{"coins":5}');
    createStore(backend, config).keepPrevious();
    expect(backend.read(`${config.storageKey}.previous`)).toBe('{"coins":5}');
  });
});

// The language is a setting with a default, so no version bump: a save without one takes the
// device's language, and only a language the app offers is ever kept.
describe('language setting', () => {
  const withDevice = (lang, raw) => {
    const backend = memoryBackend();
    if (raw !== undefined) backend.write(config.storageKey, JSON.stringify(raw));
    return createStore(backend, config, { deviceLanguage: () => lang });
  };

  it('a new game takes the device language', () => {
    expect(withDevice('es').load().settings.language).toBe('es');
    expect(withDevice('en').load().settings.language).toBe('en');
  });

  it('a save written before the setting existed gains the device language and loses nothing', () => {
    const old = { version: 7, dragonId: 'frost', coins: 42, muted: true,
      settings: { workMinutes: 25, breakMinutes: 10, musicStyle: 'lofi' } };
    const s = withDevice('es', old).load();
    expect(s.settings).toEqual({
      workMinutes: 25, breakMinutes: 10, longBreakMinutes: 15, sessionsBeforeLongBreak: 4,
      musicStyle: 'lofi', language: 'es',
    });
    expect(s.version).toBe(7);
    expect(s.dragonId).toBe('frost');
    expect(s.coins).toBe(42);
    expect(s.muted).toBe(true);
  });

  it('keeps a chosen language across save and load, whatever the device says', () => {
    const s = withDevice('en', { settings: { language: 'es' } }).load();
    expect(s.settings.language).toBe('es');
  });

  it('only accepts a language the app offers; anything else becomes the device language', () => {
    for (const bad of ['constructor', 'fr', 'toString', '__proto__', 7, null, ['es'], 'ES']) {
      expect([bad, withDevice('es', { settings: { language: bad } }).load().settings.language]).toEqual([bad, 'es']);
      expect([bad, withDevice('en').fromSave({ settings: { language: bad } }).settings.language]).toEqual([bad, 'en']);
    }
  });

  it('reads the device through the seam, and English is the default device', () => {
    expect(defaultState(config).settings.language).toBe('en');
    expect(defaultState(config, 'es').settings.language).toBe('es');
  });
});

describe('store weekly memory of past weeks', () => {
  const load = (save) => {
    const backend = memoryBackend();
    backend.write(config.storageKey, JSON.stringify(save));
    return createStore(backend, config).load();
  };
  it('keeps a well-formed record of past weeks and drops anything else', () => {
    const past = { '2026-11-16': ['wk-blocks-3'], nope: ['x'], '2026-11-09': 'x', '2026-11-02': ['a', 3] };
    const w = load({ version: 7, weekly: { week: '2026-11-23', ids: [], paid: [], foods: 0, items: 0, past } }).weekly;
    expect(w.past).toEqual({ '2026-11-16': ['wk-blocks-3'], '2026-11-02': ['a'] });
  });
  it('adds nothing to a weekly that never had a record', () => {
    expect('past' in load({ version: 7, weekly: { week: '2026-11-23', ids: [], paid: [], foods: 0, items: 0 } }).weekly).toBe(false);
  });
});
