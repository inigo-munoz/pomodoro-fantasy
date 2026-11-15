import { describe, it, expect } from 'vitest';
import { makeBackup, readBackup, backupFileName } from './backup.js';

const save = { version: 6, dragonId: 'frost', coins: 120, xpByDragon: { frost: 640 }, lairs: {} };
const now = new Date(2026, 10, 15, 18, 30).getTime();

describe('backup file', () => {
  it('round-trips a save through its own file', () => {
    const read = readBackup(makeBackup(save, now));
    expect(read.save).toEqual(save);
    expect(read.exportedAt).toBe(new Date(now).toISOString());
  });

  it('labels the file as this app\'s backup', () => {
    expect(JSON.parse(makeBackup(save, now))).toMatchObject({ app: 'pomodoro-fantasy', save });
  });

  // A save copied by hand out of the browser has no envelope; it is still a save.
  it('accepts a bare save as well', () => {
    expect(readBackup(JSON.stringify(save))).toEqual({ save, exportedAt: null });
  });

  it.each([
    ['not JSON', 'hello'],
    ['empty', ''],
    ['null', 'null'],
    ['an array', '[1,2]'],
    ['a number', '42'],
    ['an unrelated object', '{"name":"photo","size":3}'],
    ['another app\'s envelope', '{"app":"other","save":{"coins":3}}'],
    ['an envelope without a save', '{"app":"pomodoro-fantasy"}'],
  ])('rejects %s', (_, text) => {
    expect(readBackup(text)).toBeNull();
  });

  it('names the file after the local date', () => {
    expect(backupFileName(now)).toBe('pomodoro-fantasy-backup-2026-11-15.json');
  });
});
