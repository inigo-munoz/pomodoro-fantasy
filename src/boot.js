import { config } from './data/config.js';
import { createStore } from './store/store.js';
import { localStorageBackend } from './store/localStorageBackend.js';
import { renderBackupPanel } from './ui/backupPanel.js';
import { createTranslator, deviceLanguage } from './i18n/i18n.js';

// Start the app, and never leave a child on a blank page. If start-up throws (a damaged or
// hand-edited save the checks did not foresee), show a recovery screen instead. Nothing there
// touches the save unless asked: a backup can be restored, or a new game started, and in both
// cases the save that failed is kept aside under `<key>.previous`.
// The save would not open, so its language is read on its own, and only if it is one the app
// offers; otherwise the device's. Reading it can fail too, which is not worth a second crash.
const recoveryLanguage = () => {
  try {
    const language = JSON.parse(localStorageBackend.read(config.storageKey))?.settings?.language;
    if (config.languages.includes(language)) return language;
  } catch { /* unreadable: use the device */ }
  return deviceLanguage();
};

const renderRecovery = (root, { reload }) => {
  const store = createStore(localStorageBackend, config);
  const t = createTranslator(recoveryLanguage());
  const section = document.createElement('section');
  section.className = 'screen recovery';

  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = t('recovery.title');
  const lead = document.createElement('p');
  lead.className = 'screen-lead';
  lead.textContent = t('recovery.lead');

  const fresh = document.createElement('button');
  fresh.type = 'button';
  fresh.className = 'big-btn secondary';
  fresh.dataset.action = 'start-fresh';
  fresh.textContent = t('recovery.fresh');
  fresh.addEventListener('click', () => {
    store.keepPrevious();
    localStorageBackend.remove(config.storageKey);
    reload();
  });

  section.append(title, lead, renderBackupPanel({
    t,
    onBackup: () => {},
    // Same rules as the restore in Settings: keep a copy if it fits, and if the write is
    // refused (storage full) restart on the save that was there.
    onRestore: (save) => {
      try { store.keepPrevious(); } catch { /* no room for the copy */ }
      try { store.save(store.fromSave(save)); } catch { /* old save kept */ }
      reload();
    },
  }), fresh);
  // A backup cannot be saved from a game that would not open: only restoring makes sense here.
  section.querySelector('[data-action="save-backup"]')?.remove();
  root.replaceChildren(section);
};

export const boot = (root, { createApp, reload = () => window.location.reload() }) => {
  try {
    return createApp(root);
  } catch (err) {
    console.error('Pomodoro Fantasy could not start', err);
    renderRecovery(root, { reload });
    return null;
  }
};
