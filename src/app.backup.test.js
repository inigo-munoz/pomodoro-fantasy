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
