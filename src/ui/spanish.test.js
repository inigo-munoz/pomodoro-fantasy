import { describe, it, expect, vi, afterEach } from 'vitest';
import { en } from '../i18n/en.js';
import { es } from '../i18n/es.js';
import { createTranslator } from '../i18n/i18n.js';
import { config } from '../data/config.js';
import { getDragon, dragons } from '../data/dragons.js';
import { families } from '../data/families.js';
import { foods } from '../data/foods.js';
import { furniture, slots } from '../data/furniture.js';
import { resolveTheme } from '../core/theme.js';
import { quests } from '../data/quests.js';
import { weeklyPool } from '../data/quests/weekly.js';
import { renderTitleScreen } from './titleScreen.js';
import { renderChooseFamily } from './chooseFamily.js';
import { renderChooseDragon } from './chooseDragon.js';
import { renderMainScreen } from './mainScreen.js';
import { renderShopScreen } from './shopScreen.js';
import { renderLairScreen } from './lairScreen.js';
import { renderUnlockLair } from './unlockLairScreen.js';
import { renderRecordScreen } from './recordScreen.js';
import { renderSettingsScreen } from './settingsScreen.js';
import { renderCreditsScreen } from './creditsScreen.js';
import { renderInstructionsScreen } from './instructionsScreen.js';
import { renderBackupPanel } from './backupPanel.js';
import { showQuestToast } from './questToast.js';
import { showLevelUp } from './levelUp.js';
import { credits } from '../data/credits.js';

// With Spanish chosen, no English UI text may be left on any screen. The English phrases are
// the dictionary's own: each value is cut at its {params} and every piece with a word in it
// must be absent. Keys spelled the same in both languages (proper names, "XP") are skipped.
// Catalogue text (quest titles, foods, furniture, families) is T2, so the fixtures below give
// those neutral names: a leftover found here is always UI chrome.
const englishPieces = Object.entries(en)
  .filter(([key, value]) => es[key] !== value)
  .flatMap(([, value]) => value.split(/\{\w+\}/))
  .map((piece) => piece.trim().replace(/^[\s,.!?·:]+|[\s,.!?·:]+$/g, ''))
  .filter((piece) => /[A-Za-z]{2,}/.test(piece));

const shownText = (el) => [
  el.textContent,
  ...[el, ...el.querySelectorAll('*')].flatMap((n) =>
    ['aria-label', 'alt', 'title', 'placeholder'].map((a) => n.getAttribute(a)).filter(Boolean)),
].join('\n');

const leftovers = (el) => {
  const text = shownText(el);
  return englishPieces.filter((piece) => new RegExp(`\\b${piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text));
};

const t = createTranslator('es');
const NEUTRAL = 'Zork';
const neutralFoods = foods.map((f) => ({ ...f, name: NEUTRAL }));
const neutralFurniture = furniture.map((f) => ({ ...f, name: NEUTRAL }));
const neutralFamilies = families.map((f) => ({ ...f, name: NEUTRAL, tagline: NEUTRAL }));
const dragon = getDragon('frost');

afterEach(() => {
  document.querySelectorAll('.quest-toast, .level-up-overlay').forEach((n) => n.remove());
});

describe('every screen speaks Spanish when Spanish is chosen', () => {
  it('finds English pieces to look for (the guard is not empty)', () => {
    expect(englishPieces).toContain('Settings');
    expect(englishPieces).toContain('Keep studying');
  });

  it('title, with and without a creature', () => {
    const common = { onStart: vi.fn(), onInstructions: vi.fn(), onCredits: vi.fn(), t };
    expect(leftovers(renderTitleScreen(common))).toEqual([]);
    expect(leftovers(renderTitleScreen({ ...common, continueWith: { name: 'Luna', onContinue: vi.fn() } }))).toEqual([]);
  });

  it('families and creature chooser', () => {
    const fam = renderChooseFamily({ families: neutralFamilies, creatures: dragons.filter((d) => d.family === 'dragons'),
      onPick: vi.fn(), onBack: vi.fn(), currentFamilyId: 'dragons', t });
    expect(leftovers(fam)).toEqual([]);
    const choose = renderChooseDragon({ dragons: dragons.filter((d) => d.family === 'dragons'),
      family: { name: NEUTRAL, noun: NEUTRAL }, onPick: vi.fn(), onBack: vi.fn(), currentId: 'frost', t });
    expect(leftovers(choose)).toEqual([]);
  });

  const main = (timerState, over = {}) => renderMainScreen({
    state: { coins: 30, muted: false, lairUnlocked: false, ...over.state }, dragon, xp: 150,
    lairPrice: 50, timerState: { sessionsBeforeLongBreak: 4, completedWork: 0, ...timerState },
    onBack: vi.fn(), questNews: over.questNews, lastReward: over.lastReward, theme: over.theme, t,
  });

  it.each([
    ['idle', { mode: 'work', remaining: 900, workSeconds: 900, running: false }],
    ['part-used', { mode: 'work', remaining: 500, workSeconds: 900, running: false }],
    ['running', { mode: 'work', remaining: 500, workSeconds: 900, running: true }],
    ['finished work', { mode: 'work', remaining: 0, workSeconds: 900, running: false }],
    ['break', { mode: 'break', remaining: 100, workSeconds: 900, running: false }],
    ['long break', { mode: 'longBreak', remaining: 100, workSeconds: 900, running: true }],
    ['round complete', { mode: 'work', remaining: 900, workSeconds: 900, running: false, roundComplete: true }],
    ['round complete, no count', { mode: 'work', remaining: 900, workSeconds: 900, running: false, roundComplete: true, sessionsBeforeLongBreak: 0 }],
  ])('main screen: %s', (_, timerState) => {
    expect(leftovers(main(timerState))).toEqual([]);
    expect(leftovers(main(timerState, { state: { muted: true, lairUnlocked: true }, questNews: true, lastReward: 5 }))).toEqual([]);
  });

  it('main screen phase label reads Concentración · Sesión 1 de 4', () => {
    const el = main({ mode: 'work', remaining: 900, workSeconds: 900, running: false });
    expect(el.querySelector('.phase-label').textContent).toBe('Concentración · Sesión 1 de 4');
  });

  it('shop and lair offer', () => {
    expect(leftovers(renderShopScreen({ state: { coins: 3 }, foods: neutralFoods, onBuy: vi.fn(), onBack: vi.fn(), t }))).toEqual([]);
    expect(leftovers(renderUnlockLair({ state: { coins: 3 }, price: 50, onConfirm: vi.fn(), onBack: vi.fn(), t }))).toEqual([]);
  });

  it('theme icon art carries Spanish alt text', () => {
    const theme = resolveTheme(dragon.themeId);
    const shop = renderShopScreen({ state: { coins: 3 }, foods: neutralFoods, theme, onBuy: vi.fn(), onBack: vi.fn(), t });
    expect(shop.querySelector('.coin-counter img').alt).toBe('moneda');
    expect(leftovers(shop)).toEqual([]);
    const el = main({ mode: 'work', remaining: 0, workSeconds: 900, running: false }, { lastReward: 3, theme });
    expect(leftovers(el)).toEqual([]);
  });

  it('lair, with every state of a piece on the shelf', () => {
    const [a, b, c] = neutralFurniture.filter((f) => f.slot === neutralFurniture[0].slot);
    const state = { dragonId: 'frost', coins: 9999, lairs: { frost: { owned: [a.id, b.id], slots: { [a.slot]: a.id } } } };
    expect(c).toBeDefined();
    expect(leftovers(renderLairScreen({ state, dragon, xp: 0, furniture: neutralFurniture, onBuy: vi.fn(), onPlace: vi.fn(), onBack: vi.fn(), t }))).toEqual([]);
    const poor = { dragonId: 'frost', coins: 0, lairs: {} };
    expect(leftovers(renderLairScreen({ state: poor, dragon, xp: 0, furniture: neutralFurniture, onBuy: vi.fn(), onPlace: vi.fn(), onBack: vi.fn(), t }))).toEqual([]);
  });

  it('record, week and month, with quests', () => {
    const now = new Date(2026, 9, 2, 18, 0).getTime();
    const el = renderRecordScreen({
      state: { coins: 1, lifetimeBlocks: 1, history: { '2026-09-29': { blocks: 1, minutes: 15 } }, questsPaid: [] },
      now, onBack: vi.fn(), quests: quests.map((q) => ({ ...q, title: NEUTRAL })),
      world: { furniture, slots, dragons },
      weekly: weeklyPool.slice(0, 3).map((q) => ({ ...q, title: NEUTRAL })), t,
    });
    expect(leftovers(el)).toEqual([]);
    el.querySelector('[data-range="month"]').click();
    expect(leftovers(el)).toEqual([]);
    expect(el.querySelector('.record-total').textContent).toBe('Has terminado 1 bloque en total.');
  });

  it('settings, with its confirm card and the backup panel', () => {
    const el = renderSettingsScreen({ settings: { ...config.durations.default, musicStyle: 'cozy', language: 'es' },
      config, onSave: vi.fn(), onBack: vi.fn(), onChangeDragon: vi.fn(), onBackup: vi.fn(), onRestore: vi.fn(), t });
    el.querySelector('[data-action="save-settings"]');
    el.querySelector('[data-work-preset="25"]').click();
    el.querySelector('[data-action="save-settings"]').click();
    expect(leftovers(el)).toEqual([]); // with the "Saved" note up
    el.querySelector('[data-work-preset="10"]').click();
    el.querySelector('.back-btn').click();
    expect(el.querySelector('.confirm-overlay')).not.toBeNull();
    expect(leftovers(el)).toEqual([]);
  });

  it('backup panel: confirm card and every note', async () => {
    const flush = () => new Promise((r) => setTimeout(r, 30));
    const pick = async (el, text) => {
      const input = el.querySelector('input[type="file"]');
      Object.defineProperty(input, 'files', { value: [new File([text], 'b.json')], configurable: true });
      input.dispatchEvent(new Event('change'));
      await flush();
    };
    const el = renderBackupPanel({ onBackup: () => 'downloaded', onRestore: vi.fn(), t });
    el.querySelector('[data-action="save-backup"]').click();
    await flush();
    expect(el.querySelector('.backup-note').textContent).toBe('Copia lista.');
    expect(leftovers(el)).toEqual([]);
    await pick(el, 'not a backup');
    expect(el.querySelector('.backup-note').textContent).not.toBe('');
    expect(leftovers(el)).toEqual([]);
    const failing = renderBackupPanel({ onBackup: () => { throw new Error('x'); }, onRestore: vi.fn(), t });
    failing.querySelector('[data-action="save-backup"]').click();
    await flush();
    expect(leftovers(failing)).toEqual([]);
    const { makeBackup } = await import('../core/backup.js');
    await pick(el, makeBackup({ version: 7, coins: 1 }, Date.now()));
    expect(el.querySelector('.confirm-overlay')).not.toBeNull();
    expect(leftovers(el)).toEqual([]);
  });

  it('credits and instructions chrome', () => {
    const credits = [{ section: NEUTRAL, items: [{ title: NEUTRAL, author: NEUTRAL, licence: 'CC0' }] }];
    expect(leftovers(renderCreditsScreen({ credits, onBack: vi.fn(), t }))).toEqual([]);
    const ins = renderInstructionsScreen({ onBack: vi.fn(), t });
    expect(ins.querySelector('.screen-title').textContent).toBe('Cómo funciona');
    expect(ins.querySelector('.back-btn').getAttribute('aria-label')).toBe('Volver');
  });

  it('quest toast and level up', () => {
    showQuestToast([{ title: NEUTRAL, reward: 3 }], t);
    expect(leftovers(document.querySelector('.quest-toast'))).toEqual([]);
    showQuestToast([{ title: NEUTRAL, reward: 3 }, { title: NEUTRAL, reward: 4 }], t);
    expect(document.querySelector('.quest-toast-title').textContent).toBe('¡2 misiones cumplidas!');
    expect(leftovers(document.querySelector('.quest-toast'))).toEqual([]);
    showLevelUp(dragon, dragon.levels[1], null, t);
    expect(leftovers(document.querySelector('.level-up-overlay'))).toEqual([]);
  });
});

// T2: the catalogue itself. Screens now get the real data, and none of its English may show:
// quest titles, family names, nouns and taglines, foods, furniture, the instructions and the
// credits headings and notes. Pieces are whole phrases, matched as whole words.
describe('catalogue text speaks Spanish when Spanish is chosen', () => {
  const englishInstructions = [...renderInstructionsScreen({ onBack: vi.fn() }).querySelectorAll('h2, p')]
    .map((n) => n.textContent);
  const cataloguePieces = [
    ...quests.map((q) => q.title), ...weeklyPool.map((q) => q.title),
    ...families.flatMap((f) => [f.name, f.tagline, `Choose your ${f.noun}`]),
    ...foods.map((f) => f.name), ...furniture.map((f) => f.name),
    ...credits.flatMap((g) => [g.section, ...g.items.map((i) => i.changes).filter(Boolean)]),
    ...englishInstructions,
  ];
  const found = (el) => {
    const text = shownText(el);
    return cataloguePieces.filter((piece) =>
      new RegExp(`(^|[^\\p{L}])${piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u').test(text));
  };

  it('the guard holds real English to look for', () => {
    expect(cataloguePieces).toContain('Your first block');
    expect(cataloguePieces).toContain('Bookshelf');
    expect(englishInstructions.length).toBeGreaterThan(10);
  });

  it('record: the ladder and the weekly list', () => {
    const now = new Date(2026, 9, 2, 18, 0).getTime();
    const weekly = weeklyPool.filter((q) => q.id.startsWith('wk-minutes'));
    const el = renderRecordScreen({
      state: { coins: 1, lifetimeBlocks: 1, history: {}, questsPaid: [] },
      now, onBack: vi.fn(), quests, world: { furniture, slots, dragons }, weekly, t,
    });
    expect(found(el)).toEqual([]);
    expect(el.textContent).toContain('1 hora de estudio');
    expect(el.textContent).toContain('3 horas de estudio');
  });

  it('quest toast', () => {
    showQuestToast([quests[0], weeklyPool[0]], t);
    expect(found(document.querySelector('.quest-toast'))).toEqual([]);
  });

  it('families and both choosers', () => {
    const fam = renderChooseFamily({ families, creatures: dragons, onPick: vi.fn(), onBack: vi.fn(), t });
    expect(found(fam)).toEqual([]);
    expect(fam.querySelector('.family-name').textContent).toBe('Dragones');
    for (const family of families) {
      const el = renderChooseDragon({ dragons: dragons.filter((d) => d.family === family.id), family, onPick: vi.fn(), t });
      expect(found(el)).toEqual([]);
    }
    const fallback = renderChooseDragon({ dragons: dragons.filter((d) => d.family === 'dragons'), onPick: vi.fn(), t });
    expect(fallback.querySelector('.screen-title').textContent).toBe('Dragones');
    expect(fallback.querySelector('.screen-lead').textContent).toBe('¡Elige tu dragón!');
  });

  it('shop and lair', () => {
    expect(found(renderShopScreen({ state: { coins: 3 }, foods, onBuy: vi.fn(), onBack: vi.fn(), t }))).toEqual([]);
    const [a, b] = furniture;
    const state = { dragonId: 'frost', coins: 9999, lairs: { frost: { owned: [a.id, b.id], slots: { [a.slot]: a.id } } } };
    expect(found(renderLairScreen({ state, dragon, xp: 0, furniture, onBuy: vi.fn(), onPlace: vi.fn(), onBack: vi.fn(), t }))).toEqual([]);
  });

  it('instructions, with the child\'s own settings', () => {
    const own = { workMinutes: 1, breakMinutes: 3, longBreakMinutes: 20, sessionsBeforeLongBreak: 1, musicStyle: 'lofi' };
    for (const settings of [undefined, own]) {
      const el = renderInstructionsScreen({ onBack: vi.fn(), settings, t });
      expect(found(el)).toEqual([]);
      expect(leftovers(el)).toEqual([]);
    }
  });

  it('credits headings and notes', () => {
    const el = renderCreditsScreen({ credits, onBack: vi.fn(), t });
    // Licence names stay ("SIL Open Font License"), so only our own words are looked at.
    for (const ours of el.querySelectorAll('h2, .credit-changes')) expect(found(ours)).toEqual([]);
    expect([...el.querySelectorAll('h2')].map((h) => h.textContent))
      .toEqual(['Música', 'Sonidos de la naturaleza', 'Efectos de sonido', 'Tipo de letra']);
    expect(el.querySelector('.credit-author').textContent).toBe('de Towball');
    // titles, authors and licences stay as they are
    expect(el.textContent).toContain("Towball's Crossing Deluxe");
    expect(el.textContent).toContain('CC BY 4.0');
  });
});
