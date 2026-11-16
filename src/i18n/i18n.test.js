import { describe, it, expect } from 'vitest';
import { en } from './en.js';
import { es } from './es.js';
import { createTranslator, deviceLanguage, weekdayNames, languageNames } from './i18n.js';
import { config } from '../data/config.js';

const params = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('dictionaries', () => {
  it('have the same keys in English and Spanish', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it('use the same {params} for every key in both languages', () => {
    for (const key of Object.keys(en)) {
      expect([key, params(es[key] ?? '')]).toEqual([key, params(en[key])]);
    }
  });

  it('hold only non-empty strings', () => {
    for (const dict of [en, es]) {
      for (const [key, value] of Object.entries(dict)) {
        expect([key, typeof value === 'string' && value.trim().length > 0]).toEqual([key, true]);
      }
    }
  });

  it('give every plural key a one and an other form', () => {
    for (const key of Object.keys(en)) {
      if (key.endsWith('.one')) expect(en).toHaveProperty([key.replace(/\.one$/, '.other')]);
    }
  });

  // The same no-guilt rules as the English copy: nothing in the app may scold, count down or
  // speak of something lost. Word-bounded, so "tardes" in an unrelated word cannot slip past.
  it('never use a guilt word in Spanish', () => {
    const banned = /\b(perdid[oa]s?|fallad[oa]s?|fallos?|caducad[oa]s?|tarde|fracaso|racha|avisos?|castigos?|hambre|plazos?)\b/i;
    for (const [key, value] of Object.entries(es)) expect([key, value]).not.toEqual([key, expect.stringMatching(banned)]);
  });

  it('never use a guilt word in English', () => {
    const banned = /\b(hungry|lost|missed|neglect\w*|streaks?|warnings?|failed|expired|late|deadlines?)\b/i;
    for (const [key, value] of Object.entries(en)) expect([key, value]).not.toEqual([key, expect.stringMatching(banned)]);
  });
});

describe('translator', () => {
  it('reads a key in the chosen language', () => {
    expect(createTranslator('en')('settings.title')).toBe('Settings');
    expect(createTranslator('es')('settings.title')).toBe('Ajustes');
  });

  it('fills {name} params, and leaves an unknown one as it is', () => {
    const t = createTranslator('en', { dictionaries: { en: { hi: 'Hi {name}, {who}' }, es: {} }, strict: false });
    expect(t('hi', { name: 'Luna' })).toBe('Hi Luna, {who}');
  });

  it('picks the plural form with Intl.PluralRules in both languages', () => {
    const en = createTranslator('en');
    const es = createTranslator('es');
    expect(en('record.blocks', { count: 1 })).toBe('1 block');
    expect(en('record.blocks', { count: 0 })).toBe('0 blocks');
    expect(en('record.blocks', { count: 3 })).toBe('3 blocks');
    expect(es('record.blocks', { count: 1 })).toBe('1 bloque');
    expect(es('record.blocks', { count: 0 })).toBe('0 bloques');
    // Spanish has a "many" category for a million; it falls back to the other form.
    expect(es('record.blocks', { count: 1000000 })).toBe('1000000 bloques');
  });

  it('throws on a missing key in strict mode, so a test catches it', () => {
    expect(() => createTranslator('es', { strict: true })('no.such.key')).toThrow(/no\.such\.key/);
  });

  it('falls back to English, then to the key, outside strict mode, and never throws', () => {
    const dictionaries = { en: { only: 'Only English' }, es: {} };
    const t = createTranslator('es', { dictionaries, strict: false });
    expect(t('only')).toBe('Only English');
    expect(t('nowhere')).toBe('nowhere');
  });

  it('treats an unknown language as English', () => {
    const t = createTranslator('fr');
    expect(t.lang).toBe('en');
    expect(t('settings.title')).toBe('Settings');
  });

  it('knows its language', () => {
    expect(createTranslator('es').lang).toBe('es');
  });
});

describe('weekday names', () => {
  it('are Monday-first short names in the chosen language', () => {
    expect(weekdayNames('en')).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    const es = weekdayNames('es');
    expect(es).toHaveLength(7);
    expect(es[0]).toMatch(/^Lun/);
    expect(es[6]).toMatch(/^Dom/);
  });
});

describe('device language', () => {
  it('is Spanish when the device language starts with es, English otherwise', () => {
    expect(deviceLanguage({ language: 'es-ES' })).toBe('es');
    expect(deviceLanguage({ language: 'es' })).toBe('es');
    expect(deviceLanguage({ language: 'en-GB' })).toBe('en');
    expect(deviceLanguage({ language: 'fr-FR' })).toBe('en');
    expect(deviceLanguage({})).toBe('en');
    expect(deviceLanguage(undefined)).toBe('en');
  });

  it('offers every language config lists, named in its own language', () => {
    expect(config.languages).toEqual(['en', 'es']);
    expect(languageNames).toEqual({ en: 'English', es: 'Español' });
  });
});

describe('catalogue text', () => {
  // Every id the data ships must say something in both languages, and the English must stay
  // byte for byte what the data files hold: the data stays the one source of the English.
  it('gives every permanent and weekly quest a title in both languages, the English unchanged', async () => {
    const { quests } = await import('../data/quests.js');
    const { weeklyPool } = await import('../data/quests/weekly.js');
    for (const q of [...quests, ...weeklyPool]) {
      expect([q.id, en[`quest.${q.id}`]]).toEqual([q.id, q.title]);
      expect([q.id, typeof es[`quest.${q.id}`]]).toEqual([q.id, 'string']);
    }
  });

  it('names every family, its noun and its tagline in both languages, the English unchanged', async () => {
    const { families } = await import('../data/families.js');
    for (const f of families) {
      for (const field of ['name', 'noun', 'tagline']) {
        expect(en[`family.${f.id}.${field}`]).toBe(f[field]);
        expect(typeof es[`family.${f.id}.${field}`]).toBe('string');
      }
    }
  });

  it('names every food and piece of furniture in both languages, the English unchanged', async () => {
    const { foods } = await import('../data/foods.js');
    const { furniture } = await import('../data/furniture.js');
    for (const f of foods) {
      expect(en[`food.${f.id}`]).toBe(f.name);
      expect(typeof es[`food.${f.id}`]).toBe('string');
    }
    for (const f of furniture) {
      expect(en[`furniture.${f.id}`]).toBe(f.name);
      expect(typeof es[`furniture.${f.id}`]).toBe('string');
    }
  });

  it('heads every credits section in both languages, the English unchanged', async () => {
    const { credits } = await import('../data/credits.js');
    for (const group of credits) {
      expect(en[`credits.section.${group.id}`]).toBe(group.section);
      expect(typeof es[`credits.section.${group.id}`]).toBe('string');
      for (const item of group.items.filter((i) => i.changes)) {
        expect(en[`credits.changes.${item.id}`]).toBe(item.changes);
        expect(typeof es[`credits.changes.${item.id}`]).toBe('string');
      }
    }
  });

  it('calls the weekly focus quests "estudio" in Spanish', () => {
    expect(es['quest.wk-minutes-60']).toBe('1 hora de estudio');
    expect(es['quest.wk-minutes-120']).toBe('2 horas de estudio');
    expect(es['quest.wk-minutes-180']).toBe('3 horas de estudio');
  });

  it('gives the Spanish nouns for the chooser lead', () => {
    expect(['dragons', 'cats', 'unicorns', 'wolves'].map((id) => es[`family.${id}.noun`]))
      .toEqual(['dragón', 'gato', 'unicornio', 'lobo']);
  });
});
