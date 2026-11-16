import { art } from './art.js';

const button = (className, action, text, onClick) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.dataset.action = action;
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
};

// The front door. It runs on the default palette (no creature theme) and reads no save: the
// app hands it what it needs. Three bands, top to bottom: the name of the app, then the
// creature in play with the actions, then a quiet footer for How it works and Credits.
// With a creature in play, `continueWith` ({ name, image?, onContinue }) makes carrying on the
// primary action, one tap, with the creature shown above it; choosing another creature stays
// one tap away as the secondary button. With none, there is a single Start.
export const renderTitleScreen = ({ onStart, onInstructions, onCredits, continueWith }) => {
  const section = document.createElement('section');
  section.className = 'screen title';

  // The name of the app, not a chapter watermark: it is the hero, so it is not screenTitle().
  const name = document.createElement('h1');
  name.className = 'app-title';
  name.textContent = 'Pomodoro Fantasy';
  section.appendChild(name);

  const actions = document.createElement('div');
  actions.className = 'title-actions';

  if (continueWith?.image) {
    const portrait = document.createElement('div');
    portrait.className = 'title-creature';
    portrait.appendChild(art(continueWith.image, continueWith.name, '🥚'));
    actions.appendChild(portrait);
  }
  if (continueWith) {
    actions.appendChild(button('big-btn primary', 'continue', `Continue with ${continueWith.name}`, continueWith.onContinue));
  }
  actions.appendChild(button(
    continueWith ? 'big-btn secondary' : 'big-btn primary',
    'start-app',
    continueWith ? 'Choose a creature' : 'Start',
    onStart,
  ));
  section.appendChild(actions);

  const footer = document.createElement('nav');
  footer.className = 'title-footer';
  footer.setAttribute('aria-label', 'More');
  footer.appendChild(button('title-link', 'instructions', 'How it works', onInstructions));
  if (onCredits) footer.appendChild(button('title-link', 'credits', 'Credits', onCredits));
  section.appendChild(footer);

  return section;
};
