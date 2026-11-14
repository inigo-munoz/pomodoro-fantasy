# Creature families: dragons, cats, unicorns and wolves

Objective: a family screen between the title and the egg chooser, with four themed families of four themed creatures each.
Branch `feat/creature-families`. Delivery: `ask-on-risk`, one slice per family. Runner `npm test -- --run` (baseline 654 green).

## Specs

- **S1** (user, verbatim): "vamos a incluir en el Pomodoro fantasy más opciones, una de unicornios otra de gatos y otra de lobos."
- **S2** (user, verbatim): "Estaran en una pantalla intermedia entre el inicio y la selección de huevos, será una pantalla en la que aparezca las 4 opciones Dragones, gatos, unicornios y lobos"
- **S3** (user, verbatim): "que tenga una tematica cada una y tenga dentro otras 4 formas tambien tematicas."
- **S4** (user, verbatim): "Y si necesitas ChatGpt para la generación de imagenes vamos a realizar ahora una prueba para que no dependas de mi para la descarga de la imagenes." The assistant generates and downloads art through ChatGPT in the browser.

- **S5** (user, verbatim, answering how detailed the new worlds should be): "El mismo que el de los dragones". Each of the 12 new creatures gets a full world like a dragon: 7 icons (coin, shop, settings, sound, lair, record, break), 3 foods (apple, meat, cake), a backdrop, a lair room and 12 furniture pieces — 24 images each, 288 in total.

### Assistant calls (the user opted out of questions; each one is open to correction)

- Flow: Title → **Start** → family screen → that family's creature chooser → timer. Back from the chooser returns to the family screen; Back from the family screen returns to wherever it was opened from (the title, or Settings via Change Dragon).
- The family screen marks the family of the creature in play, as the chooser marks the creature.
- A family with no creatures yet is shown but disabled ("Coming soon"), so the screen is complete from day one and each family ships when its art is ready.
- The save does not change. Creatures stay in `dragons.js` and `state.dragonId`/`xpByDragon`, each gaining a `family` field. Renaming the save fields would risk progress for no visible gain.
- Every creature still has four stages. Only dragons hatch from an egg; the first stage of the others is themed per family: a kitten asleep in a basket (cats), a foal curled in a star (unicorns), a pup curled in its den (wolves).
- The twelve new creatures and their worlds:

| Family | Creature | World |
|---|---|---|
| Cats | Luna | moonlit night: indigo, silver |
| Cats | Sahara | desert sands: gold, terracotta |
| Cats | Sakura | cherry blossom: pink, cream |
| Cats | Coral | warm sea: coral, turquoise |
| Unicorns | Aurora | northern lights: teal, violet |
| Unicorns | Nebula | deep space: navy, magenta |
| Unicorns | Crystal | gem cave: amethyst, prism |
| Unicorns | Candy | sweets land: pastel pink, mint |
| Wolves | Shadow | night forest: charcoal, moon blue |
| Wolves | Amber | autumn woods: amber, rust |
| Wolves | Tundra | snowfield: white, ice grey |
| Wolves | Dusk | twilight canyon: plum, orange |

## Tasks

| ID | Specs | Route | Status | Commit |
|---|---|---|---|---|
| T1 | S1-S3 | inline | done | f6848c4 |
| T2 | S3, S4 | Luna inline; Sahara, Sakura, Coral art delegated (context backstop) | done | 2a90666, see L9 |
| T3 | S3, S4 | art delegated (context backstop), wiring inline | done | see L11 |
| T4 | S3, S4 | art delegated (context backstop), wiring inline | done | see L12 |
| T5 | S5 | art delegated per creature (context backstop), wiring inline | in progress | |

- **T1** Family screen and routing: `families.js`, `chooseFamily.js`, `family` on every creature, chooser filtered by family, app routing and tests. Other families show as "Coming soon".
- **T2** Cats: four creatures × 8 creature images through ChatGPT, data entries, palettes. Themed icons, foods and lair art fall back to the default theme until generated.
- **T3** Unicorns, as T2.
- **T4** Wolves, as T2.
- **T5** Worlds (S5): one subagent per creature generates its 24 images in order (room first, then furniture with the room as reference, then backdrop, foods, icons); the parent reviews, wires the theme with a test, checks it in Chrome and commits per creature. Order: cats, unicorns, wolves.

## Log

- **L1** (2026-11-14, user): "vamos a incluir en el Pomodoro fantasy más opciones, una de unicornios otra de gatos y otra de lobos. Estaran en una pantalla intermedia entre el inicio y la selección de huevos, será una pantalla en la que aparezca las 4 opciones Dragones, gatos, unicornios y lobos, que tenga una tematica cada una y tenga dentro otras 4 formas tambien tematicas. Comienza con ello."
- **L2** (2026-11-14, user): "arranca directamente. Y si necesitas ChatGpt para la generación de imagenes vamos a realizar ahora una prueba para que no dependas de mi para la descarga de la imagenes."
- **L3** ChatGPT test passed: prompt typed in chatgpt.com, the generated image read as a blob and saved through a download link to `~/Downloads` as a 1254 px PNG with real alpha. No manual step needed.
- **L4** Cost: a full dragon world is ~30 images. Phase 1 per family is the 8 creature images (required by `dragons.test.js`, which checks sleep and flap art on disk); themed icons, foods and lair come after.
- **L5** T1 done in `f6848c4`: family screen, per-family chooser, routing; RED observed (3 new files + 6 app routing tests), GREEN 666. Checked in Chrome on the dev server.
- **L6** Luna done in `2a90666`: 8 frames, one ChatGPT conversation, frost-baby as style reference. Adult "flap" frame for a cat is a paw wave; the field name stays `flapImage`. Theme `luna` borrows the generic icons, emoji for lair and break. GREEN 669, checked in Chrome.
- **L7** Browser automation notes: the composer is `[contenteditable][aria-label="Pregunta a ChatGPT"]`; image counts are unreliable because ChatGPT unloads old images, so "finished" is a new last image followed by a "Copiar imagen" button. JS calls time out at 45 s.
- **L8** `853f803`: copy speaks of "your creature" (instructions, Change Creature, lair blurb); instructions explain the family screen. RED 4, GREEN 670.
- **L9** Sahara, Sakura and Coral: art by a subagent (24 images, 3 edits regenerated for fake checkerboard or white backgrounds), reviewed in a montage. My own failed montage command overwrote `coral-adult-flap.webp`; rebuilt from its PNG and every webp re-checked at 512x512. Data and palettes wired; GREEN 674; cats chooser checked in Chrome.
- **L10** Automation lessons from the subagent: clear the composer before typing (drafts survive navigation); detect the new image as the one after the last `[data-user-message-bubble="true"]`, since blob URLs are recreated; ask for "REAL transparency (alpha channel), do NOT paint a checkerboard" on edits.
- **L11** Unicorns: 32 images by a subagent, none regenerated; I reviewed all 32 in one montage. Wired with a reusable script; RED 1, GREEN 679. Nebula adult (navy coat on a dark bg) checked in Chrome: readable thanks to the stage halo. Wolves art delegated next.
- **L12** Wolves: 32 images by a subagent. It reported three greeting frames shifted right; measured by silhouette overlap (lower 60% of the alpha mask), only Amber was really off (78 px of 1254), the rest match as well as the shipped dragons. Amber's PNG was shifted 78 px left and its webp rebuilt. A paw-based alignment was tried first and rejected: the curled tail fooled it. Wired; RED 2, GREEN 685; all four families enabled and the wolves chooser checked in Chrome.
- **L13** Open, not in scope of this feature: the twelve new creatures borrow the shared icons and the default food and lair art. Their themed icons, foods, rooms and furniture (about 22 images each) are a follow-up.
- **L14** (2026-11-14, user): "Genial, continua"; then, asked per family, mixed or per creature: "El mismo que el de los dragones". Backdrops are portrait 1024x1536 originals shipped as 720x1080 webp, dark, calm sky on top so the timer reads.
- **L15** BLOCKED on ChatGPT quota: "Has agotado tu cupo de imágenes" after 13 world images (about 110 images today in total); ChatGPT says to retry 2026-11-15 at 12:29. Luna has 12/24 (room + 11 furniture, committed as art only, not wired); missing: hatchling, backdrop, 3 foods, 7 icons. The hatchling can be made in the conversation "Generar observatorio lunar", which holds the room. At ~13 images per quota window, the remaining 276 images need many windows. Brief template and per-creature briefs: `odd/tasks/creature-families/world-brief.md` + `worlds.json` (append the creature block from worlds.json to the brief). Wiring: `odd/tasks/creature-families/fulltheme.py <id>` swaps a borrowed theme for the full one and adds the id to `fullWorlds` in `src/data/themes.test.js`.
- **L16** (2026-11-14, user, choosing between batches in ChatGPT or trying another generator): "1". Decision: keep ChatGPT for an identical style; resume batch by batch whenever the quota returns and the user says to continue, one creature per commit. Next: Luna hatchling (in "Generar observatorio lunar"), backdrop, foods, icons; then wire with `fulltheme.py luna`.
- **L17** (2026-11-14, user): "Haz push", then "Abre tu el PR". Pushed `feat/creature-families`; opened PR #9 against main (https://github.com/inigo-munoz/pomodoro-fantasy/pull/9). T5 stays in progress on the same branch; merging is the user's call.
