import { english } from '../i18n/i18n.js';
// The four slots are identified by id everywhere in the data and the save file. Those ids
// are not words a child hears: "floorLeft" has to become a spoken name in a lair aria-label.
// It lives here so a slot is never named in two places.
//
// The spoken name needs the side, because a screen reader announces all four buttons in one
// room and two of them are floors.
// The words themselves live in the dictionaries (lair.slot.*); `slotPhrase` is "on the wall",
// whole, because Spanish needs the article to agree with the slot ("en la pared", "en el centro").
const SLOTS = new Set(['wall', 'floorLeft', 'floorRight', 'center']);

export const slotName = (slot, t = english) => (SLOTS.has(slot) ? t(`lair.slot.${slot}`) : slot);

export const slotPhrase = (slot, t = english) => (SLOTS.has(slot) ? t(`lair.on.${slot}`) : slot);
