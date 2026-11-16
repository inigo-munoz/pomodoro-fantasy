import { describe, it, expect, vi, afterEach } from 'vitest';
import { showExactAlarmsPrompt } from './exactAlarmsPrompt.js';
import { createTranslator } from '../i18n/i18n.js';

afterEach(() => document.querySelectorAll('.exact-alarms-prompt').forEach((n) => n.remove()));

const open = (lang = 'en') => {
  const handlers = { onOpenSettings: vi.fn(), onNotNow: vi.fn() };
  const overlay = showExactAlarmsPrompt({ t: createTranslator(lang), ...handlers });
  return { overlay, ...handlers };
};

describe('exact alarms prompt', () => {
  it('is a modal dialog over the page with a title, one sentence and two buttons', () => {
    const { overlay } = open();
    expect(document.body.contains(overlay)).toBe(true);
    expect(overlay.getAttribute('role')).toBe('dialog');
    expect(overlay.getAttribute('aria-modal')).toBe('true');
    expect(overlay.getAttribute('aria-label')).toBe('Ring right on time?');
    expect(overlay.textContent).toContain('allow Alarms & reminders for Pomodoro Fantasy');
    expect(overlay.querySelector('[data-action="exact-alarms-open"]').textContent).toBe('Open settings');
    expect(overlay.querySelector('[data-action="exact-alarms-later"]').textContent).toBe('Not now');
  });

  it('sits on the same card as the other confirm dialogs, so it has a background', () => {
    const { overlay } = open();
    expect(overlay.classList.contains('confirm-overlay')).toBe(true);
    expect(overlay.querySelector(':scope > .unlock-card .unlock-title').textContent).toBe('Ring right on time?');
  });

  it('Open settings closes it and opens the setting', () => {
    const { overlay, onOpenSettings, onNotNow } = open();
    overlay.querySelector('[data-action="exact-alarms-open"]').click();
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(onNotNow).not.toHaveBeenCalled();
    expect(document.body.contains(overlay)).toBe(false);
  });

  it('Not now closes it and opens nothing', () => {
    const { overlay, onOpenSettings, onNotNow } = open();
    overlay.querySelector('[data-action="exact-alarms-later"]').click();
    expect(onNotNow).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).not.toHaveBeenCalled();
    expect(document.body.contains(overlay)).toBe(false);
  });

  it('speaks Spanish when Spanish is saved', () => {
    const { overlay } = open('es');
    expect(overlay.querySelector('[data-action="exact-alarms-open"]').textContent).toBe('Abrir ajustes');
    expect(overlay.querySelector('[data-action="exact-alarms-later"]').textContent).toBe('Ahora no');
  });
});
