# Credits

## Music

The settings screen offers four soundtracks: **Cozy** (the default), **Lofi**, **Enchanted** and **Nature**. Both ship
in `public/art/music/` and are fetched only when played.

### Cozy

The four tracks come from **Towball's Crossing Deluxe!** by **Towball**, released
under the [Creative Commons Attribution 4.0 International
licence](https://creativecommons.org/licenses/by/4.0/). That licence requires attribution,
so this file is not a courtesy — it is the condition of use.

Source: https://towball.itch.io/towballs-crossing-deluxe

| File | Track | Length |
|------|-------|--------|
| `public/art/music/crossing-main-theme.mp3` | Main Theme | 2:27 |
| `public/art/music/crossing-noon.mp3` | Noon | 2:06 |
| `public/art/music/crossing-6pm.mp3` | 6pm | 2:43 |
| `public/art/music/crossing-9pm.mp3` | 9pm | 2:36 |

**Changes made to the originals**, as CC-BY requires us to state: each track was transcoded
from its original bitrate down to 96 kbps, and its embedded cover art was stripped. Nothing
was edited, cut or remixed. The transcode took the set from 18 MB to 6.8 MB, which matters
because these are fetched over the network rather than precached by the service worker.

The author states that no generative AI was used in making this music.

#### Why these four

They were chosen by measurement as well as by ear. Across the pack's 26 hourly tracks the
integrated loudness spans 5.3 dB; these four sit within **0.2 dB of each other** (−17.8 to
−18.0 LUFS). The playlist is a shuffled rotation that advances mid-session, so a loud track
following a quiet one is a jolt at exactly the wrong moment.

The Lofi set that Cozy replaced as the default had a **6.3 dB spread** (−11.9 to −18.2 LUFS), which was never
measured when that rotation was built.

### Lofi

Four Pixabay lofi tracks, under the
[Pixabay Content License](https://pixabay.com/service/license-summary/). They were the
only soundtrack until the Cozy set replaced them, and are offered again as an alternative.
Their provenance is recorded here in full, since it cannot be recovered from the files.

| File | Title | Author | Source | AI generated |
|------|-------|--------|--------|--------------|
| `lofi-01.mp3` | Study Lofi Music | APALONBeats | https://pixabay.com/music/lofi-study-lofi-music-576259/ | not stated |
| `lofi-02.mp3` | Lofi Study Session | alex-morgan | https://pixabay.com/music/lofi-lofi-study-session-568160/ | yes |
| `lofi-03.mp3` | Lofi Relax | ZephiraMusic | https://pixabay.com/music/lofi-lofi-relax-582283/ | yes |
| `lofi-04.mp3` | Lofi Relaxing | ZephiraMusic | https://pixabay.com/music/lofi-lofi-relaxing-582284/ | yes |

These files were also transcoded from 256 kbps down to 96 kbps, which is why their
checksums never matched a fresh Pixabay download. They were identified after the fact from
their original download filenames and confirmed by track duration, because Pixabay strips
the ID3 title and artist tags when it re-encodes an upload.

That recovery is the reason the current tracks are named after the music they contain
rather than by index, and the reason their metadata was kept rather than stripped.

### Enchanted

Four tracks from the **Ambient Harp** series by **Dream-Protocol** on Pixabay, under the
[Pixabay Content License](https://pixabay.com/service/license-summary/) (no attribution
required; credited here anyway). No "AI generated" label was shown on any page when they were
downloaded on 2026-11-15. The originals (256 kbps) are kept in `art-src/audio/music-enchanted/`
under their download filenames, the only provenance Pixabay leaves.

| File | Title | Source | Original LUFS |
|------|-------|--------|---------------|
| `enchanted-slow-river.mp3` | Slow River | https://pixabay.com/music/ambient-slow-river-ambient-harp-117809/ | −16.7 |
| `enchanted-the-mystic.mp3` | The Mystic | https://pixabay.com/music/ambient-the-mystic-ambient-harp-117813/ | −19.7 |
| `enchanted-asleep-in-the-clouds.mp3` | Asleep In The Clouds | https://pixabay.com/music/ambient-asleep-in-the-clouds-ambient-harp-117799/ | −19.4 |
| `enchanted-autumn-leaves.mp3` | Autumn Leaves | https://pixabay.com/music/ambient-autumn-leaves-ambient-harp-117800/ | −18.3 |

**Changes:** the originals spread 3.0 LU, so each was levelled with a linear gain to −18.0 LUFS
(the Cozy set's level) behind a −1.5 dBFS limiter, then transcoded to 96 kbps stereo with
metadata stripped. Pages note the tracks are Content ID registered (HAAWK); that affects videos
on YouTube, not use inside the app.

### Nature

Four ambiences from Pixabay (sound effects section), same licence and download date, none
labelled AI generated. Originals in `art-src/audio/music-nature/`.

| File | Title | Author | Source | Original LUFS |
|------|-------|--------|--------|---------------|
| `nature-forest.mp3` | Forest Ambience | SoundReality | https://pixabay.com/sound-effects/film-special-effects-forest-ambience-540695/ | −21.0 |
| `nature-forest-birds.mp3` | Forest Birds Sound | SoundReality | https://pixabay.com/sound-effects/nature-forest-birds-sound-576539/ | −19.9 |
| `nature-rain.mp3` | Soft Rain on Window Glass | Eryliaa | https://pixabay.com/sound-effects/nature-soft-rain-on-window-glass-422406/ | −44.9 |
| `nature-ocean.mp3` | calm ocean waves, early in the morning | MarcinFlorida | https://pixabay.com/sound-effects/nature-calm-ocean-waves-early-in-the-morning-140020/ | −29.0 |

**Changes:** the originals spread 25 LU, so each was levelled with a linear gain to −22.0 LUFS
(quieter than the music sets on purpose: an ambience sits under the work) behind a −1.5 dBFS
limiter, and transcoded to 96 kbps stereo. The rain needed +23.5 dB, which also lifts its noise
floor; listen to it before shipping.

## Sound effects

Recorded effects replace the synthesized tones of the same name (`src/audio/tones.js`); `quest`,
`purr` and `chitter` are new. All Pixabay Content License, downloaded 2026-11-15, none labelled
AI generated; originals in `art-src/audio/sfx/`. Each was levelled (about −18 to −22 LUFS) and
transcoded to 96 kbps mono. They are precached by the service worker, unlike the music.

| File | Used for | Title | Author | Source |
|------|----------|-------|--------|--------|
| `public/art/sfx/bell.mp3` | a block or break ends | Soft Notification | Universfield | https://pixabay.com/sound-effects/film-special-effects-soft-notification-146623/ |
| `public/art/sfx/levelup.mp3` | the creature grows | Level Complete | Universfield | https://pixabay.com/sound-effects/film-special-effects-level-complete-143022/ |
| `public/art/sfx/quest.mp3` | a quest pays | Magic Twinkle | Universfield | https://pixabay.com/sound-effects/film-special-effects-magic-twinkle-244951/ |
| `public/art/sfx/pet-purr.mp3` | petting a cat in its egg, a kitten, or a sleeping cat | Purring Cat | Universfield | https://pixabay.com/sound-effects/nature-purring-cat-156459/ |
| `public/art/sfx/pet-chitter.mp3` | petting any other creature in its egg, or asleep | Cute Animal Chitter | DRAGON-STUDIO | https://pixabay.com/sound-effects/film-special-effects-cute-animal-chitter-487653/ |
| `public/art/sfx/pet-meow-young.mp3` | petting a young cat | Cute Cat Meow | DRAGON-STUDIO | https://pixabay.com/sound-effects/nature-cute-cat-meow-472372/ |
| `public/art/sfx/pet-meow.mp3` | petting an adult cat | Cat Meow Sound | Virtual_Vibes | https://pixabay.com/sound-effects/nature-cat-meow-sound-383823/ |
| `public/art/sfx/pet-neigh-young.mp3` | petting a young unicorn | horse neigh shortened | freesound_community | https://pixabay.com/sound-effects/nature-horse-neigh-shortened-84724/ |
| `public/art/sfx/pet-neigh.mp3` | petting an adult unicorn | Horse Whinny (Copyright Free) | DRAGON-STUDIO | https://pixabay.com/sound-effects/nature-horse-whinny-copyright-free-515978/ |
| `public/art/sfx/pet-roar.mp3` | petting a young dragon | Epic Dragon Roar | DRAGON-STUDIO | https://pixabay.com/sound-effects/film-special-effects-epic-dragon-roar-364481/ |
| `public/art/sfx/pet-growl.mp3` | petting a fully grown dragon | Dragon Growl | DRAGON-STUDIO | https://pixabay.com/sound-effects/horror-dragon-growl-364483/ |
| `public/art/sfx/pet-howl-young.mp3` | petting a young wolf | Wolf Howl 4 | DRAGON-STUDIO | https://pixabay.com/sound-effects/nature-wolf-howl-4-631468/ |
| `public/art/sfx/pet-howl.mp3` | petting an adult wolf | Realistic Wolf Howling Sound Effect – Echoing Wild Call SFX | PWLPL | https://pixabay.com/sound-effects/nature-realistic-wolf-howling-sound-effect-echoing-wild-call-sfx-444193/ |
| `public/art/sfx/pet-sparkle.mp3` | petting a baby unicorn | Fairy Sparkle | humordome | https://pixabay.com/sound-effects/fairy-sparkle-451414/ |
| `public/art/sfx/pet-whimper.mp3` | petting a baby wolf | Puppy whimpering 01 | faespencer | https://pixabay.com/sound-effects/nature-puppy-whimpering-01-264687/ |
| `public/art/sfx/pet-squeak.mp3` | petting a baby dragon | Small Creature | Kuzu420 | https://pixabay.com/sound-effects/nature-small-creature-270041/ |

The petting voices are trimmed (1.2 to 2.8 s, with a short fade-out), levelled and made mono; the adult wolf howl was 5.2 s long, the pup's whimper 8.1 s. Baby and young voices sit a little quieter than the adult ones.

Also downloaded but not used: Kenney **Interface Sounds** (CC0,
https://kenney.nl/assets/interface-sounds), kept with its `License.txt` in
`art-src/audio/sfx/kenney-interface-sounds/`. They were meant for button taps; on
2026-11-17 it was decided that buttons stay silent, so they do not ship.

## Fonts

### Cinzel (display only)

- **Used for**: the title on the front door and the heading on every screen. Body text stays
  on `system-ui` on purpose — a child still learning to read should not have to decode an
  engraved serif to follow the instructions.
- **Licence**: SIL Open Font License 1.1. The full licence ships at `public/fonts/OFL.txt`.
- **Copyright**: 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel)
- **Why self-hosted**: this is an offline PWA. Loading it from Google's CDN would be a network
  request the app cannot make when it is offline, so the `.woff2` lives in `public/fonts/` and
  is precached with everything else. That is why `woff2` was added to the workbox
  `globPatterns` in `vite.config.js`.
