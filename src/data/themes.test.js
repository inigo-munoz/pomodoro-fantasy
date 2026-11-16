import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { furniture } from './furniture.js';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { themes } from './themes.js';

// Every key the UI asks for, read off the themedIcon(theme, '…') calls themselves, so the
// list cannot drift from the code and a key nobody renders cannot creep back in.
const sourceFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const path = join(dir, e.name);
  if (e.isDirectory()) return sourceFiles(path);
  return e.name.endsWith('.js') && !e.name.endsWith('.test.js') ? [path] : [];
});

const usedKeys = [...new Set(sourceFiles('src').flatMap((file) =>
  [...readFileSync(file, 'utf8').matchAll(/themedIcon\([^,()]+,\s*'([^']+)'\)/g)].map((m) => m[1])))]
  .sort();

describe('theme icon sets', () => {
  it('finds the keys the UI uses', () => {
    expect(usedKeys).toEqual(['break', 'coin', 'lair', 'record', 'settings', 'shop', 'sound']);
  });

  it.each(Object.keys(themes))('gives %s exactly the keys the UI uses', (id) => {
    expect(Object.keys(themes[id].icons).sort()).toEqual(usedKeys);
  });
});

// A creature's world is everything a dragon has: its own icons, foods, room, backdrop and all
// twelve pieces of furniture, each a file that exists. Creatures join this list as their world
// is painted; until then they borrow the shared icons and the default emoji.
const fullWorlds = ['frost', 'blaze', 'thorn', 'tempest', 'luna', 'sahara', 'sakura', 'coral', 'aurora', 'nebula', 'crystal', 'candy'];

describe('full creature worlds', () => {
  const imagePaths = (theme) => [
    ...Object.values(theme.icons), ...Object.values(theme.foods),
    ...Object.values(theme.furniture), theme.room, theme.backdrop,
  ];

  it.each(fullWorlds)('gives %s a backdrop, a room, three foods and all twelve furniture pieces', (id) => {
    const t = themes[id];
    expect(t.backdrop).toBe(`/art/backdrops/${id}.webp`);
    expect(t.room).toBe(`/art/lair/${id}-room.webp`);
    expect(Object.keys(t.foods).sort()).toEqual(['apple', 'cake', 'meat']);
    expect(Object.keys(t.furniture).sort()).toEqual(furniture.map((f) => f.id).sort());
  });

  it.each(fullWorlds)('ships every image of the %s world on disk', (id) => {
    for (const path of imagePaths(themes[id])) expect(existsSync(`public${path}`)).toBe(true);
  });
});
