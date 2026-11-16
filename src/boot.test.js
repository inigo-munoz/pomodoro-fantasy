import { describe, it, expect, vi, beforeEach } from 'vitest';
import { boot } from './boot.js';
import { config } from './data/config.js';
import { makeBackup } from './core/backup.js';

const flush = () => new Promise((r) => setTimeout(r, 30));
let root;
beforeEach(() => {
  window.localStorage.clear();
  root?.remove();
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('boot', () => {
  it('starts the app when nothing goes wrong', () => {
    const createApp = vi.fn();
    boot(root, { createApp });
    expect(createApp).toHaveBeenCalledWith(root);
    expect(root.querySelector('.screen.recovery')).toBeNull();
  });

  // If the app cannot start, the save is never touched and the child is not left with a blank
  // page: a recovery screen offers a backup restore or a fresh start that keeps the old save.
  describe('when the app cannot start', () => {
    const failing = () => { throw new Error('bad save'); };

    it('shows a recovery screen and leaves the save as it was', () => {
      window.localStorage.setItem(config.storageKey, '{"coins":5}');
      boot(root, { createApp: failing, reload: vi.fn() });
      expect(root.querySelector('.screen.recovery')).not.toBeNull();
      expect(root.textContent).toContain('could not open your game');
      expect(window.localStorage.getItem(config.storageKey)).toBe('{"coins":5}');
    });

    it('speaks the language the broken save chose, when it can still be read', () => {
      window.localStorage.setItem(config.storageKey, JSON.stringify({ settings: { language: 'es' } }));
      boot(root, { createApp: failing, reload: vi.fn() });
      expect(root.querySelector('.screen-title').textContent).toBe('¡Vaya!');
      expect(root.querySelector('[data-action="start-fresh"]').textContent).toBe('Empezar una partida nueva');
      expect(root.querySelector('[data-action="restore-backup"]').textContent).toBe('Recuperar una copia');
    });

    it('falls back to the device language when the save cannot be read at all', () => {
      window.localStorage.setItem(config.storageKey, '{broken');
      boot(root, { createApp: failing, reload: vi.fn() });
      expect(root.querySelector('.screen-title').textContent).toBe('Oops');
    });

    it('restores a backup from there, keeping the save it replaces, and restarts', async () => {
      window.localStorage.setItem(config.storageKey, '{"coins":5}');
      const reload = vi.fn();
      boot(root, { createApp: failing, reload });
      const input = root.querySelector('.backup-panel input[type="file"]');
      Object.defineProperty(input, 'files', { value: [new File([makeBackup({ dragonId: 'frost', coins: 230 }, Date.now())], 'b.json')], configurable: true });
      input.dispatchEvent(new Event('change'));
      await flush();
      root.querySelector('[data-action="confirm-restore"]').click();
      expect(JSON.parse(window.localStorage.getItem(config.storageKey)).coins).toBe(230);
      expect(window.localStorage.getItem(`${config.storageKey}.previous`)).toBe('{"coins":5}');
      expect(reload).toHaveBeenCalledOnce();
    });

    it('starts a new game only on request, keeping the old save aside', () => {
      window.localStorage.setItem(config.storageKey, '{"coins":5}');
      const reload = vi.fn();
      boot(root, { createApp: failing, reload });
      root.querySelector('[data-action="start-fresh"]').click();
      expect(window.localStorage.getItem(config.storageKey)).toBeNull();
      expect(window.localStorage.getItem(`${config.storageKey}.previous`)).toBe('{"coins":5}');
      expect(reload).toHaveBeenCalledOnce();
    });

    it('restarts on the old save, without throwing, when the restored save cannot be written', async () => {
      window.localStorage.setItem(config.storageKey, '{"coins":5}');
      const reload = vi.fn();
      boot(root, { createApp: failing, reload });
      const input = root.querySelector('.backup-panel input[type="file"]');
      Object.defineProperty(input, 'files', { value: [new File([makeBackup({ coins: 230 }, Date.now())], 'b.json')], configurable: true });
      input.dispatchEvent(new Event('change'));
      await flush();
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
      expect(() => root.querySelector('[data-action="confirm-restore"]').click()).not.toThrow();
      setItem.mockRestore();
      expect(window.localStorage.getItem(config.storageKey)).toBe('{"coins":5}');
      expect(reload).toHaveBeenCalledOnce();
    });
  });

  it('restores into the injected backend when it is given one', async () => {
    const box = { [config.storageKey]: '{"coins":5}' };
    const backend = { read: (k) => (k in box ? box[k] : null), write: (k, v) => { box[k] = v; }, remove: (k) => { delete box[k]; } };
    const reload = vi.fn();
    boot(root, { createApp: () => { throw new Error('bad save'); }, reload, backend });
    const input = root.querySelector('.backup-panel input[type="file"]');
    Object.defineProperty(input, 'files', { value: [new File([makeBackup({ dragonId: 'frost', coins: 230 }, Date.now())], 'b.json')], configurable: true });
    input.dispatchEvent(new Event('change'));
    await flush();
    root.querySelector('[data-action="confirm-restore"]').click();
    expect(JSON.parse(box[config.storageKey]).coins).toBe(230);
    expect(box[`${config.storageKey}.previous`]).toBe('{"coins":5}');
    expect(window.localStorage.getItem(config.storageKey)).toBeNull();
  });
});
