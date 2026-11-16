import { english } from '../i18n/i18n.js';
import { readBackup } from '../core/backup.js';

// FileReader rather than Blob.text(): it is everywhere, older Android WebViews included.
const readText = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsText(file);
});

const button = (className, action, text, onClick) => {
  const b = document.createElement('button');
  b.className = className;
  b.dataset.action = action;
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
};

// Save a copy of the game to a file, or bring one back. A restore replaces the whole game on
// this device, so it always asks first; a file that is not a backup changes nothing.
export const renderBackupPanel = ({ onBackup, onRestore, t = english }) => {
  const panel = document.createElement('div');
  panel.className = 'settings-panel backup-panel';

  const title = document.createElement('h2');
  title.className = 'backup-title';
  title.textContent = t('backup.title');
  const lead = document.createElement('p');
  lead.className = 'backup-lead';
  lead.textContent = t('backup.lead');

  const note = document.createElement('p');
  note.className = 'backup-note';
  note.setAttribute('role', 'status');

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.hidden = true;

  const confirmRestore = (save) => {
    const card = document.createElement('div');
    card.className = 'level-up-card confirm-card';
    const heading = document.createElement('p');
    heading.className = 'confirm-title';
    heading.textContent = t('backup.confirmTitle');
    const body = document.createElement('p');
    body.textContent = t('backup.confirmBody');
    const overlay = document.createElement('div');
    const close = () => overlay.remove();
    card.append(
      heading, body,
      button('big-btn', 'confirm-restore', t('backup.replace'), () => { close(); onRestore(save); }),
      button('big-btn secondary', 'cancel-restore', t('backup.keep'), close),
    );
    overlay.className = 'level-up-overlay confirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', t('backup.confirmTitle'));
    overlay.appendChild(card);
    panel.appendChild(overlay);
  };

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    note.textContent = '';
    let text = '';
    try { text = await readText(file); } catch { text = ''; }
    const backup = readBackup(text);
    if (!backup) {
      note.textContent = t('backup.notBackup');
      return;
    }
    confirmRestore(backup.save);
  });

  panel.append(
    title, lead,
    button('big-btn', 'save-backup', t('backup.save'), () => {
      note.textContent = '';
      // onBackup says how it went: a backup shared or downloaded is confirmed, a share sheet
      // closed by the child is not an error, and a failure asks to try again.
      let outcome;
      try { outcome = onBackup(); } catch (err) { outcome = Promise.reject(err); }
      Promise.resolve(outcome).then(
        (outcome) => { if (outcome === 'shared' || outcome === 'downloaded') note.textContent = t('backup.ready'); },
        () => { note.textContent = t('backup.failed'); },
      );
    }),
    button('big-btn secondary', 'restore-backup', t('backup.restore'), () => input.click()),
    input, note,
  );
  return panel;
};
