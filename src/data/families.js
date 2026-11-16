// The four families the child chooses between before picking a creature. Each card shows how
// the family begins, the first stage of one of its creatures (Blaze's egg, Sakura's basket,
// Aurora's star, Tundra's nest, the lightest of the wolves' on its dark card), with the emoji as the fallback if the picture fails to load. Every creature in
// dragons.js names one of these in its `family` field. The file keeps its old name because the
// save does too: `dragonId` and `xpByDragon` hold any creature, and renaming them would put
// existing progress at risk for no visible gain.
export const families = [
  { id: 'dragons', name: 'Dragons', noun: 'dragon', icon: '🐉', image: '/art/dragons/blaze-egg.webp',
    backdrop: '/art/backdrops/family-dragons.webp',
    tagline: 'Hatched from eggs of ice, fire, forest and storm.' },
  { id: 'cats', name: 'Cats', noun: 'cat', icon: '🐱', image: '/art/cats/sakura-egg.webp',
    backdrop: '/art/backdrops/family-cats.webp',
    tagline: 'Magic cats of the moon, the sands, the blossoms and the sea.' },
  { id: 'unicorns', name: 'Unicorns', noun: 'unicorn', icon: '🦄', image: '/art/unicorns/aurora-egg.webp',
    backdrop: '/art/backdrops/family-unicorns.webp',
    tagline: 'Born from northern lights, stars, crystals and sweets.' },
  { id: 'wolves', name: 'Wolves', noun: 'wolf', icon: '🐺', image: '/art/wolves/tundra-egg.webp',
    backdrop: '/art/backdrops/family-wolves.webp',
    tagline: 'Wild spirits of the night, the autumn, the snow and the dusk.' },
];

// Behind the family screen itself: the four worlds meeting, with no creature in the way.
export const familiesBackdrop = '/art/backdrops/families.webp';

export const getFamily = (id) => families.find((f) => f.id === id) ?? null;
