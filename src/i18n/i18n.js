import { en } from './en.js';
import { es } from './es.js';

// The languages the app speaks, each named in its own language: a name never changes with
// the language on screen, so a child who switched by mistake can still find her own.
export const languageNames = { en: 'English', es: 'Español' };

const DICTIONARIES = { en, es };

// The first language of a device that has none saved yet. Spanish for any Spanish locale
// (es, es-ES, es-MX...), English for everything else. `nav` is the seam: tests hand one in.
export const deviceLanguage = (nav = globalThis.navigator) =>
  (typeof nav?.language === 'string' && nav.language.toLowerCase().startsWith('es') ? 'es' : 'en');

// Under vitest a missing key throws, so a screen that asks for a key nobody wrote fails its
// test; in the built app it falls back to English and then to the key, and never crashes.
const STRICT = import.meta.env?.MODE === 'test';

const fill = (text, params) =>
  text.replace(/\{(\w+)\}/g, (whole, name) => (name in params ? String(params[name]) : whole));

/**
 * t(key, params) for one language. A key with `.one` / `.other` forms (and any other
 * Intl.PluralRules category) is chosen by `params.count`; a missing category uses `.other`.
 */
export const createTranslator = (lang, { dictionaries = DICTIONARIES, strict = STRICT } = {}) => {
  const chosen = Object.hasOwn(dictionaries, lang) ? lang : 'en';
  const own = dictionaries[chosen] ?? {};
  const fallback = dictionaries.en ?? {};
  const rules = new Intl.PluralRules(chosen);
  const lookup = (key) => {
    if (Object.hasOwn(own, key)) return own[key];
    if (strict) throw new Error(`Missing ${chosen} translation for "${key}"`);
    return Object.hasOwn(fallback, key) ? fallback[key] : null;
  };
  const has = (key) => Object.hasOwn(own, key) || Object.hasOwn(fallback, key);
  const t = (key, params = {}) => {
    if (Number.isFinite(params.count) && !has(key) && has(`${key}.other`)) {
      const form = `${key}.${rules.select(params.count)}`;
      return fill(lookup(has(form) ? form : `${key}.other`) ?? key, params);
    }
    return fill(lookup(key) ?? key, params);
  };
  t.lang = chosen;
  return t;
};

// The English translator, for any screen rendered without one (tests, and a default that
// keeps every existing call site working).
export const english = createTranslator('en');

// Monday-first short weekday names, from Intl in the chosen language. Built from a known
// Monday in UTC so no time zone can shift a name onto the wrong column. Capitalised, since
// Spanish writes them in lower case and they head a column on their own.
export const weekdayNames = (lang) => {
  const format = new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => {
    const name = format.format(new Date(Date.UTC(2024, 0, 1 + i))).replace(/\.$/, '');
    return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1);
  });
};
