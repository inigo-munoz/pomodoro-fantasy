import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp as raw } from './app.js';
import { config } from './data/config.js';
import { getDragon } from './data/dragons.js';
import { quests } from './data/quests.js';
import { createStore } from './store/store.js';
import { localStorageBackend } from './store/localStorageBackend.js';
import { makeBackup, readBackup } from './core/backup.js';

let root;
const stored = () => JSON.parse(window.localStorage.getItem(config.storageKey));
const seed = (save) => window.localStorage.setItem(config.storageKey, JSON.stringify(save));
const flush = () => new Promise((r) => setTimeout(r, 30));

const openSettings = (options) => {
  root = document.createElement('div');
  document.body.appendChild(root);
  raw(root, options);
  root.querySelector('[data-action="start-app"]').click();
  const id = stored()?.dragonId;
  root.querySelector(`[data-family="${getDragon(id).family}"]`).click();
  root.querySelector(`[data-dragon="${id}"]`).click();
  root.querySelector('[data-action="settings"]').click();
};

const pickFile = async (text) => {
  const input = root.querySelector('.backup-panel input[type="file"]');
  Object.defineProperty(input, 'files', { value: [new File([text], 'b.json')], configurable: true });
  input.dispatchEvent(new Event('change'));
  await flush();
};

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { root?.remove(); root = null; vi.useRealTimers(); });

// The daughter's game: a grown dragon, coins, a furnished lair, every quest paid.
const grown = {
  version: 6, dragonId: 'frost', coins: 230, xpByDragon: { frost: 900 }, lifetimeBlocks: 140,
  lairUnlocked: true, lairs: { frost: { owned: ['bed', 'lamp'], slots: { floorLeft: 'bed', floorRight: 'lamp' } } },
  questsPaid: quests.map((q) => q.id), history: {},
};

describe('createApp backup', () => {
  it('saves a backup of the game as it is stored, in a dated file', () => {
    seed(grown);
    const saveFile = vi.fn();
    openSettings({ saveFile, reload: vi.fn() });
    root.querySelector('[data-action="save-backup"]').click();
    expect(saveFile).toHaveBeenCalledOnce();
    const [name, text] = saveFile.mock.calls[0];
    expect(name).toMatch(/^pomodoro-fantasy-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(readBackup(text).save).toEqual(stored());
  });

  it('restores a backup over another game, migrated like a load, then restarts', async () => {
    seed({ ...grown, dragonId: 'blaze', coins: 3, xpByDragon: { blaze: 10 }, lairs: {} });
    const reload = vi.fn();
    openSettings({ saveFile: vi.fn(), reload });
    await pickFile(makeBackup(grown, Date.now()));
    root.querySelector('[data-action="confirm-restore"]').click();
    const expected = createStore(localStorageBackend, config).fromSave(grown);
    expect(stored()).toEqual(expected);
    expect(stored().xpByDragon.frost).toBe(900);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('keeps the game it replaces under a separate key, so a wrong file is not the end of it', async () => {
    seed({ ...grown, dragonId: 'blaze', coins: 3 });
    const before = window.localStorage.getItem(config.storageKey);
    openSettings({ saveFile: vi.fn(), reload: vi.fn() });
    await pickFile(makeBackup(grown, Date.now()));
    root.querySelector('[data-action="confirm-restore"]').click();
    expect(window.localStorage.getItem(`${config.storageKey}.previous`)).toBe(before);
  });

  it('restores a bare save copied by hand from the browser', async () => {
    seed({ ...grown, dragonId: 'blaze', xpByDragon: {} });
    const reload = vi.fn();
    openSettings({ saveFile: vi.fn(), reload });
    await pickFile(JSON.stringify(grown));
    root.querySelector('[data-action="confirm-restore"]').click();
    expect(stored().dragonId).toBe('frost');
    expect(stored().coins).toBe(230);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('leaves the save byte for byte as it was when the restore is cancelled or the file is wrong', async () => {
    seed(grown);
    const reload = vi.fn();
    openSettings({ saveFile: vi.fn(), reload });
    const before = window.localStorage.getItem(config.storageKey);
    await pickFile('{"name":"photo"}');
    await pickFile(makeBackup({ ...grown, coins: 1 }, Date.now()));
    root.querySelector('[data-action="cancel-restore"]').click();
    expect(window.localStorage.getItem(config.storageKey)).toBe(before);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('createApp backup: when the device says no', () => {
  // A write the browser refuses (storage full) must not leave the app stopped: the old game is
  // still stored, so start again from it.
  it('keeps the old game and restarts when the restored save cannot be written', async () => {
    seed(grown);
    const reload = vi.fn();
    openSettings({ saveFile: vi.fn(), reload });
    const before = window.localStorage.getItem(config.storageKey);
    await pickFile(makeBackup({ ...grown, coins: 1 }, Date.now()));
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(() => root.querySelector('[data-action="confirm-restore"]').click()).not.toThrow();
    setItem.mockRestore();
    expect(window.localStorage.getItem(config.storageKey)).toBe(before);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not leave a failed save of the backup file unhandled', async () => {
    seed(grown);
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    openSettings({ saveFile: vi.fn(async () => { throw new Error('no space'); }), reload: vi.fn() });
    root.querySelector('[data-action="save-backup"]').click();
    await flush();
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});

// The three saves the security review traced to a blank page on every launch now open.
describe('createApp with a damaged save', () => {
  it.each([
    ['a music style named after an Object method', { dragonId: 'frost', settings: { musicStyle: 'constructor' } }],
    ['a lair whose owned list is a string', { dragonId: 'frost', lairs: { frost: { owned: 'abc' } } }],
    ['no history and a running timer that already ended', { dragonId: 'frost', history: null, timer: { mode: 'work', running: true, remaining: 60, endsAt: 0 } }],
    ['markup in the mute flag', { dragonId: 'frost', muted: '"><img src=x onerror=alert(1)>' }],
  ])('opens with %s', (_, save) => {
    seed(save);
    // A block in play reopens on the timer, so the test opens the app as it is, wherever it lands.
    root = document.createElement('div');
    document.body.appendChild(root);
    expect(() => raw(root, { saveFile: vi.fn(), reload: vi.fn() })).not.toThrow();
    expect(root.querySelector('.screen.title, .screen.main')).not.toBeNull();
    expect(root.querySelector('img[src="x"]')).toBeNull();
  });
});

describe('createApp backup: when only the kept copy does not fit', () => {
  it('still restores the backup', async () => {
    seed({ ...grown, dragonId: 'blaze', coins: 3 });
    openSettings({ saveFile: vi.fn(), reload: vi.fn() });
    await pickFile(makeBackup(grown, Date.now()));
    const real = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (k, v) {
      if (k.endsWith('.previous')) throw new DOMException('full', 'QuotaExceededError');
      return real.call(this, k, v);
    });
    root.querySelector('[data-action="confirm-restore"]').click();
    setItem.mockRestore();
    expect(stored().coins).toBe(230);
  });
});

// Two tabs on one save: the last to write used to wipe the other's progress. A write from
// another tab now reloads this one onto it.
describe('createApp with the save changed in another tab', () => {
  it('reloads when another tab writes the save', () => {
    seed(grown);
    const reload = vi.fn();
    openSettings({ saveFile: vi.fn(), reload });
    window.dispatchEvent(new StorageEvent('storage', { key: config.storageKey, newValue: '{"coins":1}' }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('ignores changes to other keys', () => {
    seed(grown);
    const reload = vi.fn();
    openSettings({ saveFile: vi.fn(), reload });
    window.dispatchEvent(new StorageEvent('storage', { key: 'something-else', newValue: 'x' }));
    expect(reload).not.toHaveBeenCalled();
  });
});
