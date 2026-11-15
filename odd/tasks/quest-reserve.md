# Quest reserve: a long permanent ladder, weekly quests that expire, and quest packs

Branch `feat/quest-reserve` (worktree `../Pomodoro Dragon quests`, cut from `main` fe2c58d). Delivery: ask-on-risk; the chain strategy is asked before the pull request. Runner: `npx vitest run`, baseline 36 files / 693 tests green.

## Specs

- **S1** (user, verbatim): "Quiero añadir más misiones de manera que haya una reserva grande de misiones" — the permanent ladder grows from 9 to about 70 quests, all derived from state the save already holds (`lifetimeBlocks`, `xpByDragon`, `lairs`, `lairUnlocked`, the creature catalogue with its `family`). They never expire. The nine existing quest ids stay unchanged, so a quest already in `questsPaid` is never paid again.
- **S2** (user, verbatim): "Las misiones de cada semana tienen que caducar. Y se pueden poner en semanas posteriores." — three weekly quests are drawn each calendar week (Monday to Sunday, local time) from a pool of about 40. When the week ends they expire, paid or not, and three new ones are drawn. An expired quest may be drawn again in a later week, but never in the week straight after the one it was in. The draw is deterministic from the week key (no `Math.random`), so tests can pin it. Each weekly quest pays once per week it is drawn in. About one easy, one medium and one hard quest per week; rewards average about 12 coins (about 25% of a week's study income at 20 blocks).
- **S3** (user, verbatim): "Y tiene que haber más misiones. O plantear el ir sacando ampliaciones con el tiempo con más misiones." — the catalogue lives in pack files (`src/data/quests/`), so an expansion is a new pack file plus its test, with no logic change. This round ships the base pack (permanent) and the weekly pool.
- **S4** Weekly measures come from `history` where possible (blocks, minutes, days studied, best day this week). Anything else (foods bought, furniture bought this week) needs weekly counters in the save: `version` 6 → 7 with a migration that keeps every existing field. `config.storageKey` is untouched.
- **S5** No guilt, assumption carried from the quest feature: an expired quest simply disappears. Copy never says `hungry|lost|missed|neglect|streak|warning|failed|expired`; the weekly section says new quests arrive on Monday.
- **S6** Record screen (assumption, open to correction): a "This week" section with the three weekly quests, then the permanent ladder condensed to the next five unfinished quests plus "N of M done". The instructions screen copy mentions weekly quests.

## Tasks

| ID | Specs | Route | Status | Commit |
|---|---|---|---|---|
| T1 | S1, S3 | delegated writer (parallel with T2, disjoint surfaces) | done | 9fa8759 |
| T2 | S2, S4, S5 | delegated writer (parallel with T1, disjoint surfaces) | done | ab679ce |
| T3 | S5, S6 | inline after T1+T2 | done | 680f467 |
| T4 | all | independent verifier (Risk item 1: save migration) | done | 596c700 (correction) |

- **T1** Permanent ladder: `src/data/quests/` packs (base pack keeps the nine ids), new measure kinds in `src/core/quests.js` (creatures at a stage, adults per family, decorations, full rooms, pets placed, items owned, blocks ladder), tests.
- **T2** Weekly engine: `src/core/weekly.js` (week key, deterministic draw, expiry/roll, progress, pay once per week), weekly pool data, save v7 with `weekly`, counters bumped on buying food and furniture in `src/app.js`, settle on load and after each action.
- **T3** Record screen sections and instructions copy.
- **T4** Verifier over the whole document, probes on a copy of the base.

## Log

- **L1** (2026-11-15, user): "Quiero añadir más misiones de manera que haya una reserva grande de misiones, haz el cálculo para ver cuantas sería lógico tener u también ver la opción de misiones semanales"
- **L2** Calculation: 9 quests worth 265 coins, finished in about 5 weeks at 20 blocks/week (assumed 4 blocks a day, 5 days a week). All content (16 adults, 16 full lairs) is about 13,200 coins, about 1,900 blocks, about 2 years. One quest every 2-3 days over that span is about 100-120 quests; quest coins capped near 20% of income.
- **L3** (2026-11-15, user): "Las misiones de cada semana tienen que caducar. Y se pueden poner en semanas posteriores. Y tiene que haber más misiones. O plantear el ir sacando ampliaciones con el tiempo con más misiones." This reverses the earlier no-expiry decision for weekly quests only; the permanent ladder still never expires.
- **L4** (2026-11-15, user): "Si", to the plan: about 70 permanent + 3 weekly from a pool of about 40 + expansions as packs.
- **L5** Forecast about 750 authored lines across T1-T3. Risk: item 1 (persisted format: save v7).
- **L6** T1 `9fa8759`: 68 permanent quests, 2,735 coins, base pack + `questPacks`; RED 12 core tests, GREEN. Two app tests pinned the old 9-quest payouts; updated in the same commit to read the catalogue (each commit passes alone: 718).
- **L7** T2 `ab679ce`: pool of 39 (13 per tier, avg ~12.5 coins), `src/core/weekly.js` (FNV-1a + mulberry32 seeded by the Monday key, reuses `weekOf`), save v7 `weekly: {week, ids, paid, foods, items}` with `cleanWeekly`; drawing on load does not write the save. RED 3 store + 9 app + new files; GREEN 761.
- **L8** T3 `680f467`: Record shows "This week" (3 quests, note "New quests arrive every Monday.") and the ladder as "N of 68 quests done" plus five next rungs: the first unfinished of each theme (blocks, lair, creatures, families), then the next in catalogue order. Grouping by `kind` was tried first and showed four lair rungs of five. Instructions mention the weekly quests. RED 7 + 1 + 1, GREEN 766; checked in Chrome on a fresh save.
- **L9** T4 verifier: S1, S3, S4, S5, S6 met; S2 partially. Blocker: opening the app draws the week without saving, so a week only looked at was forgotten and its quests could come back the week after (13 of 30 sampled pairs). Advisories: Record did not roll the week while the app stayed open across Monday; the draw depended on stored ids, so two devices could disagree; upgrading pays every new rung at once (intended).
- **L10** Correction `596c700`: `weekDraw(pool, key)` draws each week from the date alone, chained from the fixed Monday 2026-01-05, each week excluding the one before; `rollWeek` uses it, and the Record rolls the week before showing it (no save write, like the load). The verifier's probe is committed as `src/app.weekly-repeat.test.js`. RED 4 + 1, GREEN 771. Recheck on the verifier's probes: all pass except its diff harness (needs `OUT`, not a regression test); its draw probe pinned the old `drawWeek(prev stored ids)` contract and passes against `weekDraw`.
