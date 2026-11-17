import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createNativeBackend, bootWithNativeStorage } from './nativeStorage.js';
import { config } from '../data/config.js';

const fakePreferences = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    get: vi.fn(async ({ key }) => ({ value: key in data ? data[key] : null })),
    set: vi.fn(async ({ key, value }) => { data[key] = value; }),
    remove: vi.fn(async ({ key }) => { delete data[key]; }),
  };
};

let root;
beforeEach(() => {
  window.localStorage.clear();
  root?.remove();
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('native backend', () => {
  it('preloads the save, its previous copy and its corrupt copy from Preferences', async () => {
    const key = config.storageKey;
    const prefs = fakePreferences({ [key]: '{"coins":5}', [`${key}.previous`]: '{"coins":1}' });
    const backend = await createNativeBackend({ load: async () => ({ Preferences: prefs }) });
    expect(prefs.get.mock.calls.map((c) => c[0].key)).toEqual([key, `${key}.previous`, `${key}.corrupt`]);
    expect(backend.read(key)).toBe('{"coins":5}');
    expect(backend.read(`${key}.previous`)).toBe('{"coins":1}');
  });

  it('rejects when Preferences cannot be read', async () => {
    const prefs = fakePreferences();
    prefs.get.mockRejectedValue(new Error('io'));
    await expect(createNativeBackend({ load: async () => ({ Preferences: prefs }) })).rejects.toThrow('io');
  });
});

describe('booting the Android app', () => {
  it('starts the app on the native backend, with the native reminders', async () => {
    const backend = { read: () => null, write: vi.fn(), remove: vi.fn() };
    const createApp = vi.fn();
    const remindersFactory = () => ({});
    await bootWithNativeStorage(root, { createApp, loadBackend: async () => backend, remindersFactory });
    expect(createApp).toHaveBeenCalledWith(root, { backend, remindersFactory });
  });

  it('recovers on the native backend when the app cannot start', async () => {
    const backend = { read: vi.fn(() => '{broken'), write: vi.fn(), remove: vi.fn() };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await bootWithNativeStorage(root, {
      createApp: () => { throw new Error('bad save'); }, loadBackend: async () => backend, reload: vi.fn(),
    });
    expect(root.querySelector('.screen.recovery')).not.toBeNull();
    expect(backend.read).toHaveBeenCalledWith(config.storageKey);
    expect(backend.write).not.toHaveBeenCalled();
  });

  // Starting on an empty store would let the first save overwrite the child's real game, so a
  // store that cannot be read stops everything and says to reopen the app.
  it('does not start, writes nothing, and says to reopen when native storage cannot be read', async () => {
    const createApp = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    await bootWithNativeStorage(root, { createApp, loadBackend: async () => { throw new Error('io'); } });
    expect(createApp).not.toHaveBeenCalled();
    expect(root.querySelector('.screen.unavailable')).not.toBeNull();
    expect(root.textContent).toMatch(/could not open the game/i);
    expect(root.textContent).toMatch(/close the app and open it again/i);
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it('says it in Spanish on a Spanish device', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES');
    await bootWithNativeStorage(root, { createApp: vi.fn(), loadBackend: async () => { throw new Error('io'); } });
    expect(root.textContent).toMatch(/no hemos podido abrir el juego/i);
    language.mockRestore();
  });
});
