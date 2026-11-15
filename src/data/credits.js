// Everyone whose work ships in the app, shown on the Credits screen. The CC BY music makes
// this a condition of use, not a courtesy: title, author, source, licence and what we changed.
// A track or effect added to config without an entry here fails src/data/credits.test.js.
// The full provenance (download filenames, loudness) lives in docs/CREDITS.md.
const PIXABAY = 'Pixabay Content License';
const pixabay = (title, author, source, files) => ({ title, author, licence: PIXABAY, source, files });

export const credits = [
  {
    section: 'Music',
    items: [
      {
        title: "Towball's Crossing Deluxe",
        author: 'Towball',
        licence: 'CC BY 4.0',
        licenceUrl: 'creativecommons.org/licenses/by/4.0/',
        source: 'towball.itch.io/towballs-crossing-deluxe',
        changes: 'Main Theme, Noon, 6pm and 9pm, transcoded to 96 kbps with the cover art removed.',
        files: [
          '/art/music/crossing-main-theme.mp3',
          '/art/music/crossing-noon.mp3',
          '/art/music/crossing-6pm.mp3',
          '/art/music/crossing-9pm.mp3',
        ],
      },
      pixabay('Study Lofi Music', 'APALONBeats', 'pixabay.com/music/lofi-study-lofi-music-576259/', ['/art/music/lofi-01.mp3']),
      pixabay('Lofi Study Session', 'alex-morgan', 'pixabay.com/music/lofi-lofi-study-session-568160/', ['/art/music/lofi-02.mp3']),
      pixabay('Lofi Relax', 'ZephiraMusic', 'pixabay.com/music/lofi-lofi-relax-582283/', ['/art/music/lofi-03.mp3']),
      pixabay('Lofi Relaxing', 'ZephiraMusic', 'pixabay.com/music/lofi-lofi-relaxing-582284/', ['/art/music/lofi-04.mp3']),
      pixabay('Ambient Harp: Slow River, The Mystic, Asleep In The Clouds, Autumn Leaves', 'Dream-Protocol',
        'pixabay.com', [
          '/art/music/enchanted-slow-river.mp3',
          '/art/music/enchanted-the-mystic.mp3',
          '/art/music/enchanted-asleep-in-the-clouds.mp3',
          '/art/music/enchanted-autumn-leaves.mp3',
        ]),
    ],
  },
  {
    section: 'Nature sounds',
    items: [
      pixabay('Forest Ambience and Forest Birds Sound', 'SoundReality', 'pixabay.com', [
        '/art/music/nature-forest.mp3',
        '/art/music/nature-forest-birds.mp3',
      ]),
      pixabay('Soft Rain on Window Glass', 'Eryliaa', 'pixabay.com', ['/art/music/nature-rain.mp3']),
      pixabay('Calm ocean waves, early in the morning', 'MarcinFlorida', 'pixabay.com', ['/art/music/nature-ocean.mp3']),
    ],
  },
  {
    section: 'Sound effects',
    items: [
      pixabay('Soft Notification, Level Complete, Magic Twinkle, Purring Cat', 'Universfield', 'pixabay.com', [
        '/art/sfx/bell.mp3',
        '/art/sfx/levelup.mp3',
        '/art/sfx/quest.mp3',
        '/art/sfx/pet-purr.mp3',
      ]),
      pixabay('Cute Animal Chitter', 'DRAGON-STUDIO', 'pixabay.com', ['/art/sfx/pet-chitter.mp3']),
    ],
  },
  {
    section: 'Font',
    items: [
      {
        title: 'Cinzel',
        author: 'The Cinzel Project Authors',
        licence: 'SIL Open Font License 1.1',
        source: 'github.com/NDISCOVER/Cinzel',
      },
    ],
  },
];
