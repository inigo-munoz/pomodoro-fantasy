import { art } from './art.js';
import { themes } from '../data/themes.js';

// Render the active theme's UI icon for `key`, falling back to the default
// theme's emoji both as the value (no theme) and as the <img> error fallback.
// The node is marked with its key so a screen can name it in its language (localizeIcons).
export const themedIcon = (theme, key) => {
  const fallback = themes.default.icons[key];
  const node = art(theme?.icons?.[key] ?? fallback, key, fallback);
  node.dataset.icon = key;
  return node;
};

// Give every themed icon art inside `root` its alt text in the screen's language. A pass over
// the finished screen rather than a translator on every themedIcon call, so the calls keep
// the one shape the theme tests read their keys from. English keeps the key, as before.
export const localizeIcons = (root, t) => {
  if (!t) return root;
  for (const img of root.querySelectorAll('img[data-icon]')) img.alt = t(`icon.${img.dataset.icon}`);
  return root;
};
