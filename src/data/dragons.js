export const dragons = [
  {
    id: 'frost',
    name: 'Frost',
    themeId: 'frost',
    levels: [
      { level: 1, xpNeeded: 0,   image: '/art/dragons/frost-egg.webp',   fallback: '🥚' },
      { level: 2, xpNeeded: 100, image: '/art/dragons/frost-baby.webp',  fallback: '🐣',
        sleepImage: '/art/dragons/frost-baby-sleep.webp' },
      { level: 3, xpNeeded: 300, image: '/art/dragons/frost-young.webp', fallback: '🐉',
        sleepImage: '/art/dragons/frost-young-sleep.webp' },
      { level: 4, xpNeeded: 600, image: '/art/dragons/frost-adult.webp', fallback: '🐲',
        sleepImage: '/art/dragons/frost-adult-sleep.webp',
        flapImage: '/art/dragons/frost-adult-flap.webp' },
    ],
  },
  {
    id: 'blaze',
    name: 'Blaze',
    themeId: 'blaze',
    levels: [
      { level: 1, xpNeeded: 0,   image: '/art/dragons/blaze-egg.webp',   fallback: '🥚' },
      { level: 2, xpNeeded: 100, image: '/art/dragons/blaze-baby.webp',  fallback: '🐣',
        sleepImage: '/art/dragons/blaze-baby-sleep.webp' },
      { level: 3, xpNeeded: 300, image: '/art/dragons/blaze-young.webp', fallback: '🐉',
        sleepImage: '/art/dragons/blaze-young-sleep.webp' },
      { level: 4, xpNeeded: 600, image: '/art/dragons/blaze-adult.webp', fallback: '🐲',
        sleepImage: '/art/dragons/blaze-adult-sleep.webp',
        flapImage: '/art/dragons/blaze-adult-flap.webp' },
    ],
  },
  {
    id: 'thorn',
    name: 'Thorn',
    themeId: 'thorn',
    levels: [
      { level: 1, xpNeeded: 0,   image: '/art/dragons/thorn-egg.webp',   fallback: '🥚' },
      { level: 2, xpNeeded: 100, image: '/art/dragons/thorn-baby.webp',  fallback: '🐣',
        sleepImage: '/art/dragons/thorn-baby-sleep.webp' },
      { level: 3, xpNeeded: 300, image: '/art/dragons/thorn-young.webp', fallback: '🐉',
        sleepImage: '/art/dragons/thorn-young-sleep.webp' },
      { level: 4, xpNeeded: 600, image: '/art/dragons/thorn-adult.webp', fallback: '🐲',
        sleepImage: '/art/dragons/thorn-adult-sleep.webp',
        flapImage: '/art/dragons/thorn-adult-flap.webp' },
    ],
  },
  {
    id: 'tempest',
    name: 'Tempest',
    themeId: 'tempest',
    levels: [
      { level: 1, xpNeeded: 0,   image: '/art/dragons/tempest-egg.webp',   fallback: '🥚' },
      { level: 2, xpNeeded: 100, image: '/art/dragons/tempest-baby.webp',  fallback: '🐣',
        sleepImage: '/art/dragons/tempest-baby-sleep.webp' },
      { level: 3, xpNeeded: 300, image: '/art/dragons/tempest-young.webp', fallback: '🐉',
        sleepImage: '/art/dragons/tempest-young-sleep.webp' },
      { level: 4, xpNeeded: 600, image: '/art/dragons/tempest-adult.webp', fallback: '🐲',
        sleepImage: '/art/dragons/tempest-adult-sleep.webp',
        flapImage: '/art/dragons/tempest-adult-flap.webp' },
    ],
  },
];

export const getDragon = (id) => dragons.find((d) => d.id === id) ?? null;
