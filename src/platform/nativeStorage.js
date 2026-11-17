import { config } from '../data/config.js';
import { createPreloadedBackend } from '../store/preloadedBackend.js';
import { boot } from '../boot.js';
import { createTranslator, deviceLanguage } from '../i18n/i18n.js';

// In the Android app the save lives in Capacitor Preferences (Android SharedPreferences), which
// Android Auto Backup copies to the device's Google account. The plugin is loaded only when
// called, so the web build never bundles it. Rejects when Preferences cannot be read.
export const createNativeBackend = async ({ load = () => import('@capacitor/preferences') } = {}) => {
  const { Preferences } = await load();
  const key = config.storageKey;
  return createPreloadedBackend(Preferences, [key, `${key}.previous`, `${key}.corrupt`]);
};

// Native storage could not be read. Starting anyway would begin on an empty store and the first
// save would overwrite the child's real game, so nothing starts and nothing is written: she is
// told to reopen the app, which reads the store again. The save cannot be read, so the device
// language it is.
const renderUnavailable = (root) => {
  const t = createTranslator(deviceLanguage());
  const section = document.createElement('section');
  section.className = 'screen unavailable';
  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = t('unavailable.title');
  const lead = document.createElement('p');
  lead.className = 'screen-lead';
  lead.textContent = t('unavailable.lead');
  section.append(title, lead);
  root.replaceChildren(section);
};

// The Android app's start-up: read the save from native storage first, then boot as the web does,
// with the same backend for the game and for the recovery screen.
export const bootWithNativeStorage = async (root, {
  createApp, loadBackend = createNativeBackend, remindersFactory, reload,
}) => {
  let backend;
  try {
    backend = await loadBackend();
  } catch (err) {
    console.error('Pomodoro Fantasy could not read native storage', err);
    renderUnavailable(root);
    return null;
  }
  return boot(root, {
    createApp: (target) => createApp(target, { backend, remindersFactory }),
    backend,
    ...(reload ? { reload } : {}),
  });
};
