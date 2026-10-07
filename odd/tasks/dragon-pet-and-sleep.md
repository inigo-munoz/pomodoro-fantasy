# Pet the dragon, and let it sleep on breaks

## Problem

Requested 2026-10-07: tapping the dragon does nothing, and during a break the dragon is the
same awake image, only faded and floating. The child wants the dragon to react when touched,
differently at each growth stage (wings flapping on the big one), and to be visibly asleep
during a break, in art that matches the existing images.

## Decision (user, 2026-10-07)

- Tap reaction per stage: egg wobbles, baby hops (squash and bounce), young twirls, adult
  flaps its wings and lifts.
- Adult wing flap uses a real second frame (wings raised) per species, alternated with the
  normal adult image (option A), not a CSS-only fake.
- Break shows a sleeping image of the SAME dragon at the SAME stage (baby, young, adult).
  The egg keeps its normal image; an egg does not sleep. Missing art falls back to the
  normal image.

## Scope

- `src/data/dragons.js`: optional `sleepImage` per level (2-4) and `flapImage` on level 4.
- `src/ui/mainScreen.js`: the dragon is a button; a tap adds a per-stage animation class,
  removed on `animationend`; adult flap swaps frames; breaks use `sleepImage`.
- `src/styles.css`: one keyframe set per stage, disabled under `prefers-reduced-motion`.
- Art: 16 new images (12 sleeping, 4 wings-up), made in ChatGPT by editing the originals in
  `art-src/dragons/`, cut out, shipped as 512px webp in `public/art/dragons/`.
- `docs/art-prompts.md`: the prompts used.

## Checklist

- [x] T1 Tap reaction per stage + sleep/flap image wiring with fallback, tests first
- [x] T2 Prompt pack for the 16 images in `docs/art-prompts.md`
- [x] T3 Generate, cut out and ship the 16 images; point `dragons.js` at them
- [x] T4 Browser check: tap on each stage, break shows sleeping art, no contrast loss

## Checks

- `npm test` (vitest) green; RED observed before GREEN for T1.
- `npm run build` succeeds.
- Assets referenced through `assetUrl()` (raw paths 404 on Pages).
- Structural readback of every new webp (alpha present, 512px).

## Routing

- T1: delegated writer (multi-file: data, main screen, styles, tests).
- T2, T3: inline (art generation through Chrome + ChatGPT, ingest by shell).
- T4: inline browser check.
- Delivery: single branch `feat/dragon-pet-and-sleep`; code forecast well under 400 lines.

## Progress

- Branch created from `main` at 29c74de.
- T1 done in 5af8151 (delegated writer). RED: 21 failing tests. GREEN: `npx vitest run` 34
  files, 640 tests passed; `npm run build` succeeded. Pet class goes on a `.dragon-pet`
  button wrapper so float/breathe on the img keep running; a second tap restarts.
- T3 started: frost-baby sleeping generated in ChatGPT and approved visually. Painted "z"
  letters dropped on purpose: the stage already draws a 💤 (`.dragon-stage.resting::after`).
  Getting PNGs to disk: a localhost relay was refused by the permission classifier; the
  user authorised downloads. Brave silently blocks repeated automatic downloads (and
  downloads from a hidden tab) until "allow multiple downloads" is granted for chatgpt.com
  and the tab is visible.
- T2 + T3 done in 22e4814. 16 images (12 sleeping, 4 wings-up), all 512x512 with alpha,
  originals in `art-src/dragons/`. Prompts recorded in `docs/art-prompts.md`. New data test
  pins every `sleepImage`/`flapImage` path and checks the file exists (RED on the old data,
  GREEN after). Two main-screen tests that assumed no shipped sleep art were updated and a
  `bare` fixture keeps the fallback tests meaningful. `npx vitest run`: 641 passed.
- T4 done in the browser (Vite dev server, Brave): egg wobbles; adult swaps frames
  base/flap/base/flap/base and ends on base; young Frost sleeps in its own art with the 💤
  during a break; a tap while asleep is `pet-stir`. Found the young twirl turned the dragon
  upside down mid-spin; fixed in 6a489a6 (rotateY, test RED then GREEN). `npx vitest run`:
  642 passed; `npm run build` succeeded.
- Not checked in the browser: baby hop and the other three species' art in place (covered
  by tests and by the side-by-side contact sheets only).
- Known wrinkle: the wings-up frames are not pixel-aligned with the originals (body a few
  pixels smaller/offset), most visible on Blaze; at 120ms per frame it reads as a flap.

## Next step

User decides on push / PR / merge of `feat/dragon-pet-and-sleep`.
