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

- [ ] T1 Tap reaction per stage + sleep/flap image wiring with fallback, tests first
- [ ] T2 Prompt pack for the 16 images in `docs/art-prompts.md`
- [ ] T3 Generate, cut out and ship the 16 images; point `dragons.js` at them
- [ ] T4 Browser check: tap on each stage, break shows sleeping art, no contrast loss

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
