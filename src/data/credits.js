// Everyone whose work ships in the app, shown on the Credits screen. The CC BY music makes
// this a condition of use, not a courtesy: title, author, source, licence and what we changed.
// A track or effect added to config without an entry here fails src/data/credits.test.js.
// The full provenance (download filenames, loudness) lives in docs/CREDITS.md.
const PIXABAY = 'Pixabay Content License';
const pixabay = (title, author, source, files) => ({ title, author, licence: PIXABAY, source, files });

export const credits = [
  {
    id: 'music',
    section: 'Music',
    items: [
      {
        id: 'towball',
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
    id: 'nature',
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
    id: 'effects',
    section: 'Sound effects',
    items: [
      pixabay('Soft Notification, Level Complete, Magic Twinkle, Purring Cat', 'Universfield', 'pixabay.com', [
        '/art/sfx/bell.mp3',
        '/art/sfx/levelup.mp3',
        '/art/sfx/quest.mp3',
        '/art/sfx/pet-purr.mp3',
      ]),
      pixabay('Cute Animal Chitter', 'DRAGON-STUDIO', 'pixabay.com', ['/art/sfx/pet-chitter.mp3']),
      pixabay('Cat Meow Sound', 'Virtual_Vibes', 'pixabay.com', ['/art/sfx/pet-meow.mp3']),
      pixabay('horse neigh shortened', 'freesound_community', 'pixabay.com', ['/art/sfx/pet-neigh-young.mp3']),
      pixabay('Realistic Wolf Howling Sound Effect', 'PWLPL', 'pixabay.com', ['/art/sfx/pet-howl.mp3']),
      pixabay('Fairy Sparkle', 'humordome', 'pixabay.com', ['/art/sfx/pet-sparkle.mp3']),
      pixabay('Puppy whimpering 01', 'faespencer', 'pixabay.com', ['/art/sfx/pet-whimper.mp3']),
      pixabay('Small Creature', 'Kuzu420', 'pixabay.com', ['/art/sfx/pet-squeak.mp3']),
      pixabay('Cute Cat Meow, Horse Whinny, Wolf Howl 4, Epic Dragon Roar, Dragon Growl', 'DRAGON-STUDIO', 'pixabay.com', [
        '/art/sfx/pet-meow-young.mp3',
        '/art/sfx/pet-neigh.mp3',
        '/art/sfx/pet-howl-young.mp3',
        '/art/sfx/pet-roar.mp3',
        '/art/sfx/pet-growl.mp3',
      ]),
    ],
  },
  {
    id: 'font',
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
