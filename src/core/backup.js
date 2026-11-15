import { dayKey } from './history.js';

// A backup is the save inside a small envelope that names the app, so a restore can tell its
// own file from any other JSON on the device. The save itself is not interpreted here: the
// store migrates it exactly as it would a save read from storage.
const APP = 'pomodoro-fantasy';

export const makeBackup = (save, now) =>
  JSON.stringify({ app: APP, exportedAt: new Date(now).toISOString(), save });

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Something only a save would hold. An unrelated JSON object has none of these.
const looksLikeSave = (v) => isObject(v)
  && (Number.isFinite(v.version) || typeof v.dragonId === 'string' || Number.isFinite(v.coins));

/**
 * The save inside a backup file, or null when the text is not one. A bare save (copied by hand
 * out of the browser) is accepted too, with no date.
 * @returns {{save: object, exportedAt: string|null} | null}
 */
export const readBackup = (text) => {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return null; }
  if (!isObject(parsed)) return null;
  if ('app' in parsed) {
    if (parsed.app !== APP || !looksLikeSave(parsed.save)) return null;
    return { save: parsed.save, exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null };
  }
  return looksLikeSave(parsed) ? { save: parsed, exportedAt: null } : null;
};

export const backupFileName = (now) => `${APP}-backup-${dayKey(now)}.json`;
