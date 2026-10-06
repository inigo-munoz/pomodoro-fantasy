# Round complete, and a phase label you can read

## Problem

Reported 2026-10-06: "When the number of sessions is reached it does not warn and carries on."

- "Number of Sessions" is the cycle length (`sessionsBeforeLongBreak`). When the long break
  ends, `advance()` returns to an idle work block and the dots restart at session 1. Only the
  bell rings; the notification is sent only when the page is hidden. Nothing on screen says
  the round is over, so the cycle looks endless.
- The phase label (`Work` / `Break` / `Long break`) exists but is small, faded text in the top
  bar (`src/styles.css:78`), so the child cannot tell what the running clock belongs to.

Focus, break and long break durations themselves were reviewed and behave correctly: nothing
auto-starts, a work block waits for Break, a break returns to an idle work block.

## Decision (user, 2026-10-06)

**Round complete and stop.** After the Nth work block the long break runs; when it ends a
visible "Round complete!" notice shows on the main screen and the timer stays stopped at
session 1 until the child starts a new round.

## Scope

- Core timer marks the round as complete when a long break ends; the flag clears on the next
  Start and survives a reload.
- Main screen shows a visible round-complete banner; the end-of-long-break notification says
  the round is complete.
- Main screen shows a clear phase label near the clock using the settings' names: "Focus",
  "Break", "Long Break", with "Session X of N" during focus.

## Checklist

- [x] T1 Round complete: core flag, persistence, banner, notice text, tests
- [x] T2 Prominent phase label near the clock, tests, styles

## Checks

- `npm test` (vitest) green; RED observed before GREEN per task.
- `npm run build` succeeds.

## Routing

- T1, T2: delegated writer (multi-file: `src/core/timer.js`, `src/app.js`,
  `src/ui/mainScreen.js`, `src/styles.css` and their tests).
- RDD: off (global), so no native review; ordinary checks only.
- Delivery: single branch `feat/round-complete`, forecast well under 400 lines.

## Progress

- Branch created from `main` at 20ea39a.
- T1 done in 6f729be (delegated writer). RED: 11 failing tests (4 core `a complete round`, 3 main screen
  `a complete round`, 4 app: long-break cycle x3 and the long-break notice). GREEN: `npm test`
  34 files, 611 tests passed. Dots stay full and the Start button reads "Start a new round"
  until the next Start clears the flag.
- T2 done (delegated writer). RED: 17 failing tests (6 new main screen phase-label tests, 11
  app tests reading the old `.mode-label` / old names, plus the new in-step label test).
  GREEN: `npm test` 34 files, 617 tests passed; `npm run build` succeeded. The label sits
  between the dots and the clock and shares one cycle computation with the dots; breaks get
  an `--accent` underline. The top bar now holds only the coin counter and mute.
