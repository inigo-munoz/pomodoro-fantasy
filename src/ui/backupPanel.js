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
export const renderBackupPanel = ({ onBackup, onRestore }) => {
  const panel = document.createElement('div');
  panel.className = 'settings-panel backup-panel';

  const title = document.createElement('h2');
  title.className = 'backup-title';
  title.textContent = 'Backup';
  const lead = document.createElement('p');
  lead.className = 'backup-lead';
  lead.textContent = 'Keep a copy of your game, or bring one back.';

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
    heading.textContent = 'Replace this game with the backup?';
    const body = document.createElement('p');
    body.textContent = 'The game on this device will be replaced by the one in the file.';
    const overlay = document.createElement('div');
    const close = () => overlay.remove();
    card.append(
      heading, body,
      button('big-btn', 'confirm-restore', 'Replace', () => { close(); onRestore(save); }),
      button('big-btn secondary', 'cancel-restore', 'Keep this game', close),
    );
    overlay.className = 'level-up-overlay confirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Replace this game with the backup?');
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
      note.textContent = 'That file is not a Pomodoro Fantasy backup.';
      return;
    }
    confirmRestore(backup.save);
  });

  panel.append(
    title, lead,
    button('big-btn', 'save-backup', 'Save a backup', () => { note.textContent = ''; onBackup(); }),
    button('big-btn secondary', 'restore-backup', 'Restore a backup', () => input.click()),
    input, note,
  );
  return panel;
};
