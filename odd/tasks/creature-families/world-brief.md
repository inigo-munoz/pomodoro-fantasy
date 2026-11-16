You generate game art in ChatGPT through the Claude in Chrome browser tools (mcp__claude-in-chrome__*; load them with ONE ToolSearch call: "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__find,mcp__claude-in-chrome__file_upload,mcp__claude-in-chrome__tabs_close_mcp"). The user authorized generating these images in their logged-in ChatGPT and downloading them to ~/Downloads. Call tabs_context_mcp (createIfEmpty true), work in ONE tab of the MCP group, and close it when you finish. Do not touch other ChatGPT conversations or settings. Never list ~/Downloads (it holds the user's private files); only touch the exact filenames you save.

Repo: the repository root (the parent names it in your prompt). Scratchpad: your session scratchpad (the parent names it in your prompt; mkdir -p it before use). No absolute personal paths in this file.

## Goal
The full themed WORLD for one creature of a children's Pomodoro app, exactly like the four dragons already have: 24 images. The creature itself already exists (8 images in `public/art/<family>/<id>-*.webp`). Read these sections of `docs/art-prompts.md` FIRST and use the Thorn prompts as your templates, adapting subject and palette (Thorn is a forest dragon; you are making the same set for the creature below):
- lines 210-300: Thorn foods and the UI icon rules + Thorn icons (icons follow the ICON rules, never the illustration rules: bold, flat-ish, readable at 32 px)
- lines 391-428: sound-on icons
- lines 429-489: the lair rules (room square, calm centre; items transparent, one bold silhouette at ~22% of the room; pets alive and content)
- lines 632-702: Thorn lair room and furniture prompts
- lines 829-860: the record icon
Also look at the existing shipped art for reference: `public/art/icons/thorn-*.webp`, `public/art/foods/thorn-*.webp`, `public/art/lair/thorn-*.webp`, `public/art/backdrops/thorn.webp` (montage a few to see the intended look). Replace every dragon motif with the creature's own (no dragons anywhere in this world).

## The 24 files (PNG names to download)
Order and conversations:
A. Conversation 1 (attach `art-src/<family>/<id>-adult.png` and `art-src/dragons/frost-baby.png` as style references): `<id>-room.png` (opaque square room, calm empty centre), then the 12 furniture items attaching nothing new (the room is in the chat; say "match the room you just made"): `<id>-banner.png`, `<id>-painting.png`, `<id>-trophy.png` (wall, high), `<id>-bed.png`, `<id>-nest.png`, `<id>-cushion.png` (floor left), `<id>-lamp.png`, `<id>-chest.png`, `<id>-shelf.png` (a bookshelf; floor right), `<id>-imp.png`, `<id>-bird.png`, `<id>-hatchling.png` (centre, pets: alive, content, happy). Items: plain fully transparent background with REAL alpha, do NOT paint a checkerboard, no floor, no wall, no shadow, one bold chunky silhouette, small margin.
B. Conversation 2 (attach the room PNG and the creature adult PNG): `<id>-backdrop.png` — PORTRAIT 2:3 (ask for 1024x1536), opaque, a DARK night scene: the top 60% is calm dark sky (the timer is drawn over it), scenery only in the lower part, no creature, no characters, no text.
C. Conversation 3 (attach the creature adult PNG): foods `<id>-apple.png`, `<id>-meat.png`, `<id>-cake.png` (transparent, appetising, illustration style like the Thorn foods).
D. Conversation 4 (attach `public/art/icons/thorn-coin.webp` converted to PNG in the scratchpad, plus the creature adult PNG): icons `<id>-coin.png`, `<id>-shop.png`, `<id>-settings.png`, `<id>-sound.png` (sound ON), `<id>-lair.png`, `<id>-record.png`, `<id>-break.png` (a chunky sleeping baby of this creature curled in a ball, eyes as two curves). Icon rules: bold simple silhouette, dark outlines, strong value contrast, readable at 32 px, transparent, no tiny details.

Every prompt: dark-fantasy children's storybook watercolor in the house style, enchanted, warm-hearted, friendly, NOT scary; centered, front view, square 1:1 (except the backdrop); PNG; no text, no letters, no 'z'.

## Browser helpers (proven)
After EVERY full navigation install with javascript_tool:
```js
window.pfSend = async (text) => {
  const box = document.querySelector('[contenteditable="true"][aria-label="Pregunta a ChatGPT"]');
  box.focus(); document.execCommand('selectAll'); document.execCommand('delete');
  document.execCommand('insertText', false, text);
  await new Promise(r => setTimeout(r, 800));
  const btn = [...document.querySelectorAll('button')].find(b => /send|enviar/i.test((b.getAttribute('aria-label')||'') + (b.dataset.testid||'')) && !b.disabled);
  if (!btn) return { sent: false }; btn.click(); return { sent: true };
};
window.pfNewImg = () => {
  const lastUser = [...document.querySelectorAll('[data-user-message-bubble="true"]')].at(-1);
  const img = [...document.querySelectorAll('main img[alt^="Imagen generada"]')].at(-1);
  if (!img || !lastUser || !(lastUser.compareDocumentPosition(img) & Node.DOCUMENT_POSITION_FOLLOWING)) return null;
  const copy = [...document.querySelectorAll('main button[aria-label="Copiar imagen"]')].at(-1);
  if (!copy || !(img.compareDocumentPosition(copy) & Node.DOCUMENT_POSITION_FOLLOWING)) return null;
  return img.complete && img.naturalWidth > 500 ? img : null;
};
window.pfSaveNew = async (name, timeoutMs = 38000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const img = pfNewImg();
    if (img) { const b = await fetch(img.src).then(r => r.blob()); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); return { saved: name, size: b.size, w: img.naturalWidth, h: img.naturalHeight }; }
    await new Promise(r => setTimeout(r, 3000));
  }
  return { timeout: true };
};
window.pfRun = async (name, text) => { const s = await pfSend(text); if (!s.sent) return s; await new Promise(r => setTimeout(r, 5000)); return await pfSaveNew(name, 33000); };
```
Per image `await pfRun('<file>.png', '<prompt>')`; JS calls time out at 45 s and an image takes 45-80 s, so on `{timeout:true}` call `await pfSaveNew('<file>.png', 40000)` until saved; never save the same image twice. If ChatGPT offers two images to choose from ("Elegir imagen 1/2"), click one first. For attachments: `find` the hidden input labelled "Adjuntar fotos", then file_upload (only PNG/JPG under the repo or scratchpad).

## Processing (from the repo root; mkdir -p the art-src and public folders first)
Move each PNG from `~/Downloads/<exact name>` (delete any " (1)" duplicate) to its art-src folder, then convert ONE file at a time (never xargs; montage output always goes to the scratchpad):
- room + furniture → `art-src/lair/<id>-<item>.png` → `convert art-src/lair/<id>-<item>.png -resize 512x512 -quality 82 -define webp:method=6 public/art/lair/<id>-<item>.webp`
- backdrop → `art-src/backdrops/<id>-backdrop.png` → `convert art-src/backdrops/<id>-backdrop.png -resize 720x1080^ -gravity south -extent 720x1080 -quality 75 -define webp:method=6 public/art/backdrops/<id>.webp`
- foods → `art-src/foods/<id>-<food>.png` → `public/art/foods/<id>-<food>.webp` (512, q82)
- icons → `art-src/icons/<id>-<key>.png` → `public/art/icons/<id>-<key>.webp` (512, q82)
Checks: items, foods and icons must have alpha (`identify -format '%[opaque]'` prints false); room and backdrop are opaque. Review montages of each group on background #1b1030 (Read them). Regenerate anything with a painted checkerboard or white box, text, a dragon, a scary look, a busy room centre, or a bright backdrop sky (mean luminance of the top 60% must stay low: `convert public/art/backdrops/<id>.webp -crop 100%x60%+0+0 -colorspace gray -format '%[fx:mean*255]' info:` should be under ~60). At most 2 regenerations per image; report anything still off.

Do NOT edit source code, docs or tests; do NOT touch git. If ChatGPT shows a usage limit, stop and report exactly which files exist. If the browser tools fail 2-3 times in a row, stop and report.

## Return
The list of the 24 shipped webp paths (mark any missing), the backdrop luminance number, quality notes, and the montage paths. Then a `## Key Learnings` block of 1-5 numbered standalone sentences (omit if none).
