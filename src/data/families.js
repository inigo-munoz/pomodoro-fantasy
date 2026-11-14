// The four families the child chooses between before picking a creature. Each card shows a
// baby of the family (chosen to stand out on its dark card; Frost's baby is too dark), with
// the emoji as the fallback if the picture fails to load. Every creature in
// dragons.js names one of these in its `family` field. The file keeps its old name because the
// save does too: `dragonId` and `xpByDragon` hold any creature, and renaming them would put
// existing progress at risk for no visible gain.
export const families = [
  { id: 'dragons', name: 'Dragons', noun: 'dragon', icon: '🐉', image: '/art/dragons/blaze-baby.webp',
    tagline: 'Hatched from eggs of ice, fire, forest and storm.' },
  { id: 'cats', name: 'Cats', noun: 'cat', icon: '🐱', image: '/art/cats/sakura-baby.webp',
    tagline: 'Magic cats of the moon, the sands, the blossoms and the sea.' },
  { id: 'unicorns', name: 'Unicorns', noun: 'unicorn', icon: '🦄', image: '/art/unicorns/aurora-baby.webp',
    tagline: 'Born from northern lights, stars, crystals and sweets.' },
  { id: 'wolves', name: 'Wolves', noun: 'wolf', icon: '🐺', image: '/art/wolves/shadow-baby.webp',
    tagline: 'Wild spirits of the night, the autumn, the snow and the dusk.' },
];

export const getFamily = (id) => families.find((f) => f.id === id) ?? null;
