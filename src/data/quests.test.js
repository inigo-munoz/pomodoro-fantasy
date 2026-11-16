import { describe, it, expect } from 'vitest';
import { quests, questPacks } from './quests.js';
import { basePack } from './quests/base.js';

describe('quest catalogue', () => {
  it('is every pack joined in order, starting with the base pack', () => {
    expect(questPacks[0]).toBe(basePack);
    expect(quests).toEqual(questPacks.flat());
  });

  it('holds no id twice across packs', () => {
    expect(new Set(quests.map((q) => q.id)).size).toBe(quests.length);
  });
});
