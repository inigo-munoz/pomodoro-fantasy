import { createApp } from './app.js';
import { boot } from './boot.js';
import { registerServiceWorker } from './pwa.js';

const root = document.querySelector('#app');

if (import.meta.env.MODE === 'native') {
  // The Android app. Everything Capacitor is loaded from inside this branch, so the web build
  // drops it. The save is read from native storage before the game starts; the reminders
  // schedule block-end notices with the system. If the notifications plugin will not load,
  // the game still starts, with the web reminders (which degrade to silence).
  Promise.all([
    import('./platform/nativeStorage.js'),
    import('./platform/nativeReminders.js')
      .then(({ loadNativeReminders }) => loadNativeReminders())
      .catch((err) => { console.error('Pomodoro Fantasy could not load notifications', err); return undefined; }),
  ]).then(([{ bootWithNativeStorage }, remindersFactory]) =>
    bootWithNativeStorage(root, { createApp, remindersFactory }));
} else {
  // The service worker first, so a fixed build can still reach a device whose save will not open.
  // Not in the Android app: its files ship inside it, and updates come from the store.
  registerServiceWorker();
  boot(root, { createApp });
}
