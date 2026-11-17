// The app's store is synchronous (read/write strings by key, like localStorage). Native storage
// on Android (Capacitor Preferences) is asynchronous. This bridges the two: every key the app
// uses is read once before start-up, the app then reads from memory, and every write goes to
// memory at once and to the native store in the background, one after another, so an older
// value can never land after a newer one. A failed native write never stops the game; the copy
// in memory carries on and the next write tries again.
// If the native store cannot be read at start-up this rejects: starting empty would let the
// next save overwrite the child's real game.
export const createPreloadedBackend = async (store, keys) => {
  const memory = new Map();
  for (const key of keys) {
    const { value } = await store.get({ key });
    memory.set(key, value ?? null);
  }

  let queue = Promise.resolve();
  const enqueue = (task) => {
    queue = queue.then(task).catch((err) => {
      console.error('Pomodoro Fantasy could not write to native storage', err);
    });
  };

  return {
    read: (key) => (memory.has(key) ? memory.get(key) : null),
    write: (key, value) => {
      memory.set(key, value);
      enqueue(() => store.set({ key, value }));
    },
    remove: (key) => {
      memory.set(key, null);
      enqueue(() => store.remove({ key }));
    },
    // Resolves when every write so far has reached the native store (or failed and was logged).
    flushed: () => queue,
  };
};
