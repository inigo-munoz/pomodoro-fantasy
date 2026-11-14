# Creature families: dragons, cats, unicorns and wolves

Objective: a family screen between the title and the egg chooser, with four themed families of four themed creatures each.
Branch `feat/creature-families`. Delivery: `ask-on-risk`, one slice per family. Runner `npm test -- --run` (baseline 654 green).

## Specs

- **S1** (user, verbatim): "vamos a incluir en el Pomodoro fantasy más opciones, una de unicornios otra de gatos y otra de lobos."
- **S2** (user, verbatim): "Estaran en una pantalla intermedia entre el inicio y la selección de huevos, será una pantalla en la que aparezca las 4 opciones Dragones, gatos, unicornios y lobos"
- **S3** (user, verbatim): "que tenga una tematica cada una y tenga dentro otras 4 formas tambien tematicas."
- **S4** (user, verbatim): "Y si necesitas ChatGpt para la generación de imagenes vamos a realizar ahora una prueba para que no dependas de mi para la descarga de la imagenes." The assistant generates and downloads art through ChatGPT in the browser.

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
| T2 | S3, S4 | Luna inline; Sahara, Sakura, Coral art delegated (context backstop) | in progress | 2a90666 (Luna) |
| T3 | S3, S4 | inline (browser) | pending | |
| T4 | S3, S4 | inline (browser) | pending | |

- **T1** Family screen and routing: `families.js`, `chooseFamily.js`, `family` on every creature, chooser filtered by family, app routing and tests. Other families show as "Coming soon".
- **T2** Cats: four creatures × 8 creature images through ChatGPT, data entries, palettes. Themed icons, foods and lair art fall back to the default theme until generated.
- **T3** Unicorns, as T2.
- **T4** Wolves, as T2.

## Log

- **L1** (2026-11-14, user): "vamos a incluir en el Pomodoro fantasy más opciones, una de unicornios otra de gatos y otra de lobos. Estaran en una pantalla intermedia entre el inicio y la selección de huevos, será una pantalla en la que aparezca las 4 opciones Dragones, gatos, unicornios y lobos, que tenga una tematica cada una y tenga dentro otras 4 formas tambien tematicas. Comienza con ello."
- **L2** (2026-11-14, user): "arranca directamente. Y si necesitas ChatGpt para la generación de imagenes vamos a realizar ahora una prueba para que no dependas de mi para la descarga de la imagenes."
- **L3** ChatGPT test passed: prompt typed in chatgpt.com, the generated image read as a blob and saved through a download link to `~/Downloads` as a 1254 px PNG with real alpha. No manual step needed.
- **L4** Cost: a full dragon world is ~30 images. Phase 1 per family is the 8 creature images (required by `dragons.test.js`, which checks sleep and flap art on disk); themed icons, foods and lair come after.
- **L5** T1 done in `f6848c4`: family screen, per-family chooser, routing; RED observed (3 new files + 6 app routing tests), GREEN 666. Checked in Chrome on the dev server.
- **L6** Luna done in `2a90666`: 8 frames, one ChatGPT conversation, frost-baby as style reference. Adult "flap" frame for a cat is a paw wave; the field name stays `flapImage`. Theme `luna` borrows the generic icons, emoji for lair and break. GREEN 669, checked in Chrome.
- **L7** Browser automation notes: the composer is `[contenteditable][aria-label="Pregunta a ChatGPT"]`; image counts are unreliable because ChatGPT unloads old images, so "finished" is a new last image followed by a "Copiar imagen" button. JS calls time out at 45 s.
