export const config = {
  // One coin for every this many minutes of work, rounded down per block: a 15-minute block
  // pays 7. Doubled from 1 on 2026-10-04 so the shop takes real saving up. Keep it a whole
  // number so coins stay integers.
  minutesPerCoin: 2,
  lairUnlockPrice: 50,
  // Days of study record kept in the save; older ones are dropped so it cannot grow forever.
  historyDays: 60,
  durations: {
    workPresets: [10, 15, 25],   // minutes
    breakPresets: [3, 5, 10],    // minutes
    longBreakPresets: [10, 15, 20], // minutes
    sessionsPresets: [2, 3, 4, 5],  // work blocks before a long break
    customRange: { min: 1, max: 60 },
    sessionsRange: { min: 1, max: 10 },
    default: {
      workMinutes: 15,
      breakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
    },
  },
  // Study soundtracks, one shuffled rotation per style. Deliberately NOT in the service
  // worker's precache globs: they are fetched when played, so installing the app stays
  // small and only the music you actually hear costs anything.
  music: {
    cozy: [
      '/art/music/crossing-main-theme.mp3',
      '/art/music/crossing-noon.mp3',
      '/art/music/crossing-6pm.mp3',
      '/art/music/crossing-9pm.mp3',
    ],
    lofi: [
      '/art/music/lofi-01.mp3',
      '/art/music/lofi-02.mp3',
      '/art/music/lofi-03.mp3',
      '/art/music/lofi-04.mp3',
    ],
    // Ambient harp, one author, levelled to -18 LUFS like Cozy (docs/CREDITS.md).
    enchanted: [
      '/art/music/enchanted-slow-river.mp3',
      '/art/music/enchanted-the-mystic.mp3',
      '/art/music/enchanted-asleep-in-the-clouds.mp3',
      '/art/music/enchanted-autumn-leaves.mp3',
    ],
    // Forest, birds, rain and sea, levelled to -22 LUFS: no melody, and quieter than music.
    nature: [
      '/art/music/nature-forest.mp3',
      '/art/music/nature-forest-birds.mp3',
      '/art/music/nature-rain.mp3',
      '/art/music/nature-ocean.mp3',
    ],
  },
  // The order the settings screen offers them in; the first is the default.
  musicStyles: ['cozy', 'lofi', 'enchanted', 'nature'],
  // The languages offered in Settings; a saved language outside this list is not kept.
  languages: ['en', 'es'],
  // Recorded effects. A name here replaces the synthesized tone of the same name in
  // src/audio/tones.js; quest and the petting voices exist only as files. Small, so precached.
  effects: {
    bell: '/art/sfx/bell.mp3',
    levelup: '/art/sfx/levelup.mp3',
    quest: '/art/sfx/quest.mp3',
    purr: '/art/sfx/pet-purr.mp3',
    chitter: '/art/sfx/pet-chitter.mp3',
    meow: '/art/sfx/pet-meow.mp3',
    neigh: '/art/sfx/pet-neigh.mp3',
    howl: '/art/sfx/pet-howl.mp3',
    roar: '/art/sfx/pet-roar.mp3',
    growl: '/art/sfx/pet-growl.mp3',
    sparkle: '/art/sfx/pet-sparkle.mp3',
    whimper: '/art/sfx/pet-whimper.mp3',
    squeak: '/art/sfx/pet-squeak.mp3',
  },
  // DO NOT rename this to match the app. localStorage is scoped to the origin, not the path, so
  // as long as this string is untouched the saves written as "Pomodoro Dragon" still load under
  // "Pomodoro Fantasy". Changing it orphans every existing save. src/data/config.test.js pins it.
  storageKey: 'pomodoro-dragon-save-v1',
};
