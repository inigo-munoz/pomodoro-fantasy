import { themes } from '../data/themes.js';
import { assetUrl } from './art.js';

// Merge a theme over the default, section by section. Anything a theme does
// not define falls back to the default theme.
export const resolveTheme = (themeId) => {
  const base = themes.default;
  const override = themes[themeId] ?? {};
  return {
    palette: { ...base.palette, ...(override.palette ?? {}) },
    icons: { ...base.icons, ...(override.icons ?? {}) },
    foods: { ...base.foods, ...(override.foods ?? {}) },
    furniture: { ...base.furniture, ...(override.furniture ?? {}) },
    // A scalar, so it falls back whole rather than merging key by key.
    room: override.room ?? base.room,
    // Same scalar rule; the default has none (null), so a theme without one stays unpainted.
    backdrop: override.backdrop ?? base.backdrop ?? null,
  };
};

// Write palette entries as CSS custom properties (e.g. { bg } -> --bg).
export const applyPalette = (palette, root = document.documentElement) => {
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(`--${key}`, value);
  }
};

// Paint the per-theme backdrop behind the main screen. With no backdrop the property is
// removed, not blanked, so var(--backdrop, none) falls back to the gradient sky.
export const applyBackdrop = (backdrop, root = document.documentElement) => {
  if (backdrop) root.style.setProperty('--backdrop', `url("${assetUrl(backdrop)}")`);
  else root.style.removeProperty('--backdrop');
};

// Undo applyPalette and applyBackdrop: drop every custom property set inline on the root, so
// the stylesheet's default palette applies again. The screens outside a creature (title,
// families, chooser, instructions) use it; without this they kept the last creature's colours.
export const clearTheme = (root = document.documentElement) => {
  // By index, from the end: removing shifts the list, and CSSStyleDeclaration is not
  // iterable everywhere (jsdom's is not).
  for (let i = root.style.length - 1; i >= 0; i -= 1) {
    const name = root.style.item(i);
    if (name.startsWith('--')) root.style.removeProperty(name);
  }
};

// The room a failed image falls back to. Furniture carries its own emoji (item.fallback); the
// room has no catalogue entry, so the default theme is where its emoji lives.
export const defaultRoom = themes.default.room;
