import { config } from './data/config.js';
import { createStore } from './store/store.js';
import { localStorageBackend } from './store/localStorageBackend.js';
import { renderBackupPanel } from './ui/backupPanel.js';

// Start the app, and never leave a child on a blank page. If start-up throws (a damaged or
// hand-edited save the checks did not foresee), show a recovery screen instead. Nothing there
// touches the save unless asked: a backup can be restored, or a new game started, and in both
// cases the save that failed is kept aside under `<key>.previous`.
const renderRecovery = (root, { reload }) => {
  const store = createStore(localStorageBackend, config);
  const section = document.createElement('section');
  section.className = 'screen recovery';

  const title = document.createElement('h1');
  title.className = 'screen-title';
  title.textContent = 'Oops';
  const lead = document.createElement('p');
  lead.className = 'screen-lead';
  lead.textContent = 'We could not open your game. You can restore a backup, or start a new game. Your old game is kept safe either way.';

  const fresh = document.createElement('button');
  fresh.type = 'button';
  fresh.className = 'big-btn secondary';
  fresh.dataset.action = 'start-fresh';
  fresh.textContent = 'Start a new game';
  fresh.addEventListener('click', () => {
    store.keepPrevious();
    localStorageBackend.remove(config.storageKey);
    reload();
  });

  section.append(title, lead, renderBackupPanel({
    onBackup: () => {},
    onRestore: (save) => {
      store.keepPrevious();
      store.save(store.fromSave(save));
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
