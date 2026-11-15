import { basePack } from './quests/base.js';

// The quest catalogue, joined from packs in src/data/quests/. Each pack is data only. To ship
// an expansion, add a new pack file there (with its own test, like base.test.js), import it
// here and append it to `questPacks`: no logic changes. Ids must stay unique across packs and
// must never be reused, because `questsPaid` in the save remembers them forever.
export const questPacks = [basePack];

export const quests = questPacks.flat();
