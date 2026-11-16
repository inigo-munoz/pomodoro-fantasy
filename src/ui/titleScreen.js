// The front door. It renders before any dragon has been chosen, so it runs on the default
// palette (no backdrop, emoji icons) and deliberately takes no state and no theme: nothing
// here may assume a dragon exists.
// With a creature in play, `continueWith` ({ name, onContinue }) makes carrying on the primary
// action, one tap; choosing another creature stays one tap away as the secondary button.
export const renderTitleScreen = ({ onStart, onInstructions, continueWith }) => {
  const section = document.createElement('section');
  section.className = 'screen title';

  // The name of the app, not a chapter watermark: it is the hero, so it is not screenTitle().
  const name = document.createElement('h1');
  name.className = 'app-title';
  name.textContent = 'Pomodoro Fantasy';
  section.appendChild(name);

  if (continueWith) {
    const carryOn = document.createElement('button');
    carryOn.className = 'big-btn primary';
    carryOn.dataset.action = 'continue';
    carryOn.textContent = `Continue with ${continueWith.name}`;
    carryOn.addEventListener('click', continueWith.onContinue);
    section.appendChild(carryOn);
  }

  const start = document.createElement('button');
  start.className = continueWith ? 'big-btn secondary' : 'big-btn primary';
  start.dataset.action = 'start-app';
  start.textContent = continueWith ? 'Choose a creature' : 'Start';
  start.addEventListener('click', onStart);
  section.appendChild(start);

  const instructions = document.createElement('button');
  instructions.className = 'title-link';
  instructions.dataset.action = 'instructions';
  instructions.textContent = 'How it works';
  instructions.addEventListener('click', onInstructions);
  section.appendChild(instructions);

  return section;
};
