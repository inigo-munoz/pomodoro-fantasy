// The four families the child chooses between before picking a creature. Every creature in
// dragons.js names one of these in its `family` field. The file keeps its old name because the
// save does too: `dragonId` and `xpByDragon` hold any creature, and renaming them would put
// existing progress at risk for no visible gain.
export const families = [
  { id: 'dragons', name: 'Dragons', noun: 'dragon', icon: '🐉',
    tagline: 'Hatched from eggs of ice, fire, forest and storm.' },
  { id: 'cats', name: 'Cats', noun: 'cat', icon: '🐱',
    tagline: 'Magic cats of the moon, the sands, the blossoms and the sea.' },
  { id: 'unicorns', name: 'Unicorns', noun: 'unicorn', icon: '🦄',
    tagline: 'Born from northern lights, stars, crystals and sweets.' },
  { id: 'wolves', name: 'Wolves', noun: 'wolf', icon: '🐺',
    tagline: 'Wild spirits of the night, the autumn, the snow and the dusk.' },
];

export const getFamily = (id) => families.find((f) => f.id === id) ?? null;
