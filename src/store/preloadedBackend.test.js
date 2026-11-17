import { describe, it, expect, vi } from 'vitest';
import { createPreloadedBackend } from './preloadedBackend.js';

// An async key-value store like Capacitor Preferences: get resolves { value }, set and remove resolve.
const fakeStore = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    get: vi.fn(async ({ key }) => ({ value: key in data ? data[key] : null })),
    set: vi.fn(async ({ key, value }) => { data[key] = value; }),
    remove: vi.fn(async ({ key }) => { delete data[key]; }),
  };
};
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('preloaded backend', () => {
  it('reads every key before the app starts, then answers synchronously', async () => {
    const store = fakeStore({ save: '{"coins":5}', 'save.previous': '{"coins":1}' });
    const backend = await createPreloadedBackend(store, ['save', 'save.previous', 'save.corrupt']);
    expect(backend.read('save')).toBe('{"coins":5}');
    expect(backend.read('save.previous')).toBe('{"coins":1}');
    expect(backend.read('save.corrupt')).toBeNull();
  });

  it('writes through to the native store, and reads its own write back at once', async () => {
    const store = fakeStore();
    const backend = await createPreloadedBackend(store, ['save']);
    backend.write('save', '{"coins":9}');
    expect(backend.read('save')).toBe('{"coins":9}');
    await flush();
    expect(store.data.save).toBe('{"coins":9}');
  });

  it('removes from both', async () => {
    const store = fakeStore({ save: 'x' });
    const backend = await createPreloadedBackend(store, ['save']);
    backend.remove('save');
    expect(backend.read('save')).toBeNull();
    await flush();
    expect('save' in store.data).toBe(false);
  });

  // The game must never stop because the native store hiccups: the copy in memory keeps going.
  it('keeps playing when a native write fails', async () => {
    const store = fakeStore();
    store.set.mockRejectedValueOnce(new Error('disk full'));
    const backend = await createPreloadedBackend(store, ['save']);
    expect(() => backend.write('save', 'a')).not.toThrow();
    await flush();
    expect(backend.read('save')).toBe('a');
  });

  it('writes in order, so an older value never lands after a newer one', async () => {
    const store = fakeStore();
    let release;
    store.set.mockImplementationOnce(({ key, value }) => new Promise((r) => { release = () => { store.data[key] = value; r(); }; }));
    const backend = await createPreloadedBackend(store, ['save']);
    backend.write('save', 'old');
    backend.write('save', 'new');
    await flush(); // the first native write has started and is held
    release();
    await flush(); await flush();
    expect(store.data.save).toBe('new');
  });

  // Starting empty would let the next save overwrite the real game. A store that cannot be
  // read is a failure the caller must see, and nothing is written.
  it('fails, and writes nothing, when the native store cannot be read', async () => {
    const store = fakeStore({ save: '{"coins":5}' });
    store.get.mockRejectedValue(new Error('unavailable'));
    await expect(createPreloadedBackend(store, ['save'])).rejects.toThrow('unavailable');
    expect(store.set).not.toHaveBeenCalled();
    expect(store.data.save).toBe('{"coins":5}');
  });
});
