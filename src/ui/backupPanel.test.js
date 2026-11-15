import { describe, it, expect, vi } from 'vitest';
import { renderBackupPanel } from './backupPanel.js';
import { makeBackup } from '../core/backup.js';

const save = { version: 6, dragonId: 'frost', coins: 120 };
const fileOf = (text) => new File([text], 'backup.json', { type: 'application/json' });
const flush = () => new Promise((r) => setTimeout(r, 30));

const setup = () => {
  const onBackup = vi.fn();
  const onRestore = vi.fn();
  const el = renderBackupPanel({ onBackup, onRestore });
  document.body.appendChild(el);
  const pick = async (text) => {
    const input = el.querySelector('input[type="file"]');
    Object.defineProperty(input, 'files', { value: [fileOf(text)], configurable: true });
    input.dispatchEvent(new Event('change'));
    await flush();
  };
  return { el, onBackup, onRestore, pick };
};

describe('backup panel', () => {
  it('saves a backup when asked', () => {
    const { el, onBackup } = setup();
    el.querySelector('[data-action="save-backup"]').click();
    expect(onBackup).toHaveBeenCalledOnce();
  });

  it('opens the file picker for a restore, for JSON files only', () => {
    const { el } = setup();
    const input = el.querySelector('input[type="file"]');
    const click = vi.spyOn(input, 'click');
    el.querySelector('[data-action="restore-backup"]').click();
    expect(click).toHaveBeenCalledOnce();
    expect(input.accept).toContain('.json');
  });

  it('asks before replacing the game, and replaces it only on Replace', async () => {
    const { el, onRestore, pick } = setup();
    await pick(makeBackup(save, Date.now()));
    const dialog = el.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(onRestore).not.toHaveBeenCalled();
    dialog.querySelector('[data-action="confirm-restore"]').click();
    expect(onRestore).toHaveBeenCalledWith(save);
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('keeps the game when the child chooses to keep it', async () => {
    const { el, onRestore, pick } = setup();
    await pick(makeBackup(save, Date.now()));
    el.querySelector('[data-action="cancel-restore"]').click();
    expect(onRestore).not.toHaveBeenCalled();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('says so when the file is not a backup, and changes nothing', async () => {
    const { el, onRestore, pick } = setup();
    await pick('{"name":"photo"}');
    expect(el.querySelector('[role="dialog"]')).toBeNull();
    expect(el.querySelector('.backup-note').textContent).toBe('That file is not a Pomodoro Fantasy backup.');
    expect(onRestore).not.toHaveBeenCalled();
  });
});
