import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp as raw } from './app.js';
import { config } from './data/config.js';
import { getDragon } from './data/dragons.js';
import { quests } from './data/quests.js';
import { weeklyPool } from './data/quests/weekly.js';
import { weekDraw, weekKey } from './core/weekly.js';

// Regression (verifier, 2026-11-15): a week that is opened but never saved (no block, no
// purchase) used to be forgotten, so the next week drew against the week before it and the
// quests just shown could come straight back.
let root;
const open = () => {
  root?.remove(); root = document.createElement('div'); document.body.appendChild(root);
  raw(root, { weeklyPool });
  root.querySelector('[data-action="start-app"]')?.click();
  root.querySelector(`[data-family="${getDragon('frost').family}"]`)?.click();
  root.querySelector('[data-dragon="frost"]')?.click();
  root.querySelector('[data-action="record"]').click();
  return [...root.querySelectorAll('.weekly-list [data-quest]')].map((e) => e.dataset.quest);
};
beforeEach(() => { vi.useFakeTimers(); window.localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); root?.remove(); root = null; });

describe('weekly quests: the week straight after', () => {
  it('never shows a quest of the week just shown, even when that week wrote no save', () => {
    vi.setSystemTime(new Date(2026, 11, 9, 12)); // week of Monday 2026-12-07
    window.localStorage.setItem(config.storageKey, JSON.stringify({
      version: 7, dragonId: 'frost', questsPaid: quests.map((q) => q.id),
      weekly: { week: '2026-11-30', ids: ['wk-blocks-3', 'wk-blocks-10', 'wk-blocks-15'], paid: [], foods: 0, items: 0 },
    }));
    const thisWeek = open();
    vi.setSystemTime(new Date(2026, 11, 16, 12)); // week of Monday 2026-12-14
    const nextWeek = open();
    for (const id of nextWeek) expect(thisWeek).not.toContain(id);
  });

  it('shows the same three quests for a week whatever the save held before it', () => {
    vi.setSystemTime(new Date(2026, 11, 9, 12));
    window.localStorage.setItem(config.storageKey, JSON.stringify({ version: 7, dragonId: 'frost', questsPaid: quests.map((q) => q.id) }));
    const fresh = open();
    window.localStorage.setItem(config.storageKey, JSON.stringify({
      version: 7, dragonId: 'frost', questsPaid: quests.map((q) => q.id),
      weekly: { week: '2026-11-30', ids: ['wk-blocks-3', 'wk-blocks-10', 'wk-blocks-15'], paid: [], foods: 0, items: 0 },
    }));
    expect(open()).toEqual(fresh);
  });
});

describe('weekly quests: a week that turns while the app is open', () => {
  it('shows the new week on the Record, even before anything else happens', () => {
    vi.setSystemTime(new Date(2026, 11, 13, 23, 59)); // Sunday night
    window.localStorage.setItem(config.storageKey, JSON.stringify({ version: 7, dragonId: 'frost', questsPaid: quests.map((q) => q.id) }));
    open();
    root.querySelector('.back-btn').click();
    vi.setSystemTime(new Date(2026, 11, 14, 0, 5)); // Monday
    root.querySelector('[data-action="record"]').click();
    const shown = [...root.querySelectorAll('.weekly-list [data-quest]')].map((e) => e.dataset.quest);
    expect(shown).toEqual(weekDraw(weeklyPool, weekKey(Date.now())));
  });
});
