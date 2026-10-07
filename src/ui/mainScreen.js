import { currentLevel, levelProgress } from '../core/dragon.js';
import { art, assetUrl } from './art.js';
import { coinCounter } from './coinCounter.js';
import { themedIcon } from './themedIcon.js';
import { isBreak } from '../core/timer.js';

const fmt = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const idleLabel = ({ mode, remaining, workSeconds, roundComplete }) => {
  if (isBreak(mode)) return '▶ Resume break';
  if (roundComplete) return '▶ Start a new round';
  return remaining < workSeconds ? '▶ Keep studying' : '▶ Start studying';
};

// During a break this shows the player's OWN dragon at its own level, resting — never a
// different creature. Swapping in the theme's sleeping-baby art made an egg appear to
// hatch when the break started and revert when it ended, and would have shown a baby to
// someone who had raised an adult. Rest is a state of your dragon, not another dragon: a
// level may carry a sleepImage of that same dragon at that same stage, and without one
// (the egg never has one) the awake art stays, dimmed by the resting classes.
const stageArt = ({ dragon, timerState }, level) => {
  const resting = isBreak(timerState.mode);
  const image = resting && level.sleepImage ? level.sleepImage : level.image;
  const node = art(image, dragon.name, level.fallback);
  if (resting && node.tagName === 'IMG') node.alt = `${dragon.name} is resting`;
  node.classList.add('dragon-art', 'alive');
  if (resting) node.classList.add('resting');
  return node;
};

// One reaction per growth stage. A sleeping dragon only stirs, whatever its stage.
const PET_REACTIONS = { 1: 'pet-wobble', 2: 'pet-hop', 3: 'pet-twirl', 4: 'pet-flap' };
const ALL_REACTIONS = [...Object.values(PET_REACTIONS), 'pet-stir'];
const FLAP_FRAME_MS = 120;
const FLAP_SWAPS = 4;

// The reaction animates the button, not the art inside it: the <img> already runs its
// float/breathe animation, and putting a second animation on it would replace those.
const petButton = (ctx, level, artNode) => {
  const resting = isBreak(ctx.timerState.mode);
  const reaction = resting ? 'pet-stir' : (PET_REACTIONS[level.level] ?? 'pet-wobble');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dragon-pet';
  btn.setAttribute('aria-label', `Pet ${ctx.dragon.name}`);
  btn.appendChild(artNode);

  let timers = [];
  const baseSrc = artNode.tagName === 'IMG' ? artNode.getAttribute('src') : null;
  const restoreFrame = () => {
    timers.forEach(clearTimeout);
    timers = [];
    const img = btn.querySelector('img');
    if (img && baseSrc) img.src = baseSrc;
  };
  const flapFrames = () => {
    const img = btn.querySelector('img');
    if (!img || !baseSrc) return;
    const flapSrc = assetUrl(level.flapImage);
    for (let i = 1; i <= FLAP_SWAPS; i += 1) {
      timers.push(setTimeout(() => { img.src = i % 2 ? flapSrc : baseSrc; }, i * FLAP_FRAME_MS));
    }
  };

  btn.addEventListener('click', () => {
    // A tap mid-reaction restarts it: drop the class, force a reflow so the browser forgets
    // the running animation, and add it back.
    restoreFrame();
    btn.classList.remove(...ALL_REACTIONS);
    void btn.offsetWidth;
    btn.classList.add(reaction);
    if (reaction === 'pet-flap' && level.flapImage) flapFrames();
  });
  btn.addEventListener('animationend', (e) => {
    if (e.target !== btn) return;
    btn.classList.remove(...ALL_REACTIONS);
    restoreFrame();
  });
  return btn;
};

// The same names the Settings screen gives the durations (Focus Time, Break Time, Long Break
// Time), so the clock and the settings speak one language.
const PHASE_NAMES = { work: 'Focus', break: 'Break', longBreak: 'Long Break' };

// Progress through the current cycle. A non-zero multiple fills every dot rather than
// wrapping back to empty, but only while the long break is due or running: that is the long
// break itself, or the fourth work block parked at 0:00. A work block that is idle or running
// with a multiple count is the START of the next cycle (advance() leaves the count alone
// when the long break ends), so it shows none filled. With no usable cycle length there is
// nothing to count, so no row is drawn.
// A work block parked at 0:00 has been earned even though advance() has not run yet: it
// only runs when Break is tapped. The bell and the filled dot have to land together, or the
// dot looks like it belongs to the tap instead of to the work.
const earnedSessions = ({ mode, remaining, running, completedWork = 0 }) =>
  mode === 'work' && remaining === 0 && !running ? completedWork + 1 : completedWork;

// The dots and the phase label both read from this, so "Session X of N" can never disagree
// with the row of dots under it. Null means there is no usable cycle length to count.
// A finished round counts as every session done until the next Start, so the dots match
// the banner instead of showing an empty row that reads as "nothing done".
const cycleProgress = (timerState) => {
  const total = timerState.sessionsBeforeLongBreak;
  if (!(total > 0)) return null;
  if (timerState.roundComplete) return { total, done: total, current: total, finished: true };
  const earned = earnedSessions(timerState);
  const inCycle = earned % total;
  const cycleComplete = timerState.mode === 'longBreak' || earned !== (timerState.completedWork ?? 0);
  const done = earned > 0 && inCycle === 0 && cycleComplete ? total : inCycle;
  return { total, done, current: Math.min(done + 1, total), finished: false };
};

const sessionDots = (cycle) => {
  if (!cycle) return '';
  const { total, done, current, finished } = cycle;
  const dots = Array.from({ length: total }, (_, i) =>
    `<span class="session-dot${i < done ? ' is-done' : ''}"></span>`).join('');
  const label = finished ? `All ${total} sessions done` : `Session ${current} of ${total}`;
  return `<div class="session-dots" aria-label="${label}">${dots}</div>`;
};

// What the running clock belongs to, big enough to read from across the room. The old label
// was small faded text in the top bar, and a child could not tell a focus block from a break.
// The session number only joins Focus: a break is not a session, and once the round is
// complete the banner says the rest.
const phaseLabel = (timerState, cycle) => {
  const mode = PHASE_NAMES[timerState.mode] ? timerState.mode : 'break';
  const session = mode === 'work' && cycle && !cycle.finished
    ? `<span class="phase-session"> · Session ${cycle.current} of ${cycle.total}</span>`
    : '';
  return `<p class="phase-label phase-${mode}"><span class="phase-name">${PHASE_NAMES[mode]}</span>${session}</p>`;
};

// The bell alone was not enough: after the long break the clock just went back to session 1
// and the round looked endless. This stays until she starts again.
const roundBanner = ({ roundComplete, sessionsBeforeLongBreak: total }) => {
  if (!roundComplete) return '';
  const all = total > 0 ? `all ${total} sessions` : 'every session';
  return `<p class="round-complete" role="status">Round complete! You finished ${all}.</p>`;
};

export const renderMainScreen = (ctx) => {
  const { state, dragon, timerState, theme } = ctx;
  const reward = ctx.lastReward > 0 ? ctx.lastReward : 0;
  const xp = ctx.xp ?? 0;
  const level = currentLevel(dragon, xp);
  const progress = levelProgress(dragon, xp);
  const cycle = cycleProgress(timerState);
  // The button is always rendered and always calls onLair; whether it opens the room or
  // the offer is routed in app.js. Locked is only presentation, so no second callback.
  const lairLocked = !state.lairUnlocked;
  const justFinishedWork =
    timerState.mode === 'work' && timerState.remaining === 0 && !timerState.running;

  const section = document.createElement('section');
  section.className = 'screen main';
  section.innerHTML =
    `<header class="top-bar">` +
      `<span class="coin-slot"></span>` +
      `<button class="icon-btn${state.muted ? ' is-muted' : ''}" data-action="mute"` +
        ` aria-pressed="${state.muted}"` +
        ` aria-label="${state.muted ? 'Unmute' : 'Mute'}"></button>` +
    `</header>` +
    sessionDots(cycle) +
    phaseLabel(timerState, cycle) +
    `<p class="timer-display">${fmt(timerState.remaining)}</p>` +
    roundBanner(timerState) +
    (reward ? `<p class="session-reward">+${reward} <span class="coin-icon"></span></p>` : '') +
    `<div class="dragon-stage${isBreak(timerState.mode) ? ' resting' : ''}"></div>` +
    `<div class="xp-bar"><div class="xp-fill" style="width:${Math.round(progress.ratio * 100)}%"></div></div>` +
    `<div class="controls"></div>` +
    `<footer class="nav-bar">` +
      `<button class="icon-btn" data-action="shop" aria-label="Shop"></button>` +
      `<button class="icon-btn${lairLocked ? ' is-locked' : ''}" data-action="lair"` +
        ` aria-label="${lairLocked ? `Lair, locked, ${ctx.lairPrice} coins` : 'Lair'}">` +
        // lairPrice is the one new interpolation: a numeric literal from config, never the save.
        (lairLocked ? `<span class="lock-price"><span class="price-coin"></span> ${ctx.lairPrice}</span>` : '') +
      `</button>` +
      `<button class="icon-btn" data-action="record" aria-label="Record"></button>` +
      `<button class="icon-btn" data-action="settings" aria-label="Settings"></button>` +
    `</footer>`;

  section.querySelector('.dragon-stage').appendChild(petButton(ctx, level, stageArt(ctx, level)));

  section.querySelector('.coin-slot').replaceWith(coinCounter(state.coins, theme));
  section.querySelector('.session-reward .coin-icon')?.appendChild(themedIcon(theme, 'coin'));
  // Always the sound icon: muted is the same speaker with a CSS stroke through it
  // (.icon-btn.is-muted::after), so the symbol stays one thing the child recognises
  // and a theme only has to supply one piece of art for the button.
  section.querySelector('[data-action="mute"]')
    .appendChild(themedIcon(theme, 'sound'));
  section.querySelector('[data-action="shop"]').appendChild(themedIcon(theme, 'shop'));
  section.querySelector('[data-action="lair"]').appendChild(themedIcon(theme, 'lair'));
  section.querySelector('[data-action="record"]').appendChild(themedIcon(theme, 'record'));
  section.querySelector('[data-action="settings"]').appendChild(themedIcon(theme, 'settings'));
  section.querySelector('.lock-price .price-coin')?.appendChild(themedIcon(theme, 'coin'));

  const controls = section.querySelector('.controls');
  if (justFinishedWork) {
    controls.appendChild(button('Break', 'break', ctx.onBreak, 'primary', themedIcon(theme, 'break')));
  } else if (timerState.running) {
    controls.appendChild(button('⏸ Pause', 'pause', ctx.onPause, 'primary'));
  } else {
    controls.appendChild(button(idleLabel(timerState), 'start', ctx.onStart, 'primary'));
  }

  section.querySelector('[data-action="mute"]').addEventListener('click', ctx.onToggleMute);
  section.querySelector('[data-action="shop"]').addEventListener('click', ctx.onShop);
  section.querySelector('[data-action="lair"]').addEventListener('click', ctx.onLair);
  section.querySelector('[data-action="record"]').addEventListener('click', ctx.onRecord);
  section.querySelector('[data-action="settings"]').addEventListener('click', ctx.onSettings);
  return section;
};

// A plain tick only changes the clock. Patching it in place (rather than rebuilding the
// screen) keeps the dragon <img> mounted, so its float/breathe animation is not restarted
// at 0% every second, which read as a jump.
export const updateMainScreen = (section, { timerState }) => {
  const display = section?.querySelector('.timer-display');
  if (display) display.textContent = fmt(timerState.remaining);
};

const button = (label, action, handler, cls = '', iconNode = null) => {
  const b = document.createElement('button');
  b.className = `big-btn ${cls}`.trim();
  b.dataset.action = action;
  b.textContent = label;
  if (iconNode) b.prepend(iconNode, ' ');
  b.addEventListener('click', handler);
  return b;
};
