import { art, paintBackdrop } from './art.js';
import { backButton } from './backButton.js';
import { screenTitle } from './screenTitle.js';
import { currentBadge } from './currentBadge.js';

// Without a family it speaks of dragons, the only family there was before the family screen.
const DRAGONS = { name: 'Dragons', noun: 'dragon' };

export const renderChooseDragon = ({ dragons, onPick, currentId, onBack, family = DRAGONS }) => {
  const section = document.createElement('section');
  section.className = 'screen choose-dragon';
  paintBackdrop(section, family.backdrop);

  // Only when there is somewhere to go back to: the first-run chooser has no screen behind it.
  if (onBack) section.appendChild(backButton(onBack));

  section.appendChild(screenTitle(family.name));

  const lead = document.createElement('p');
  lead.className = 'screen-lead';
  lead.textContent = `Choose your ${family.noun}!`;
  section.appendChild(lead);

  const grid = document.createElement('div');
  grid.className = 'dragon-grid';

  for (const dragon of dragons) {
    const choice = document.createElement('button');
    choice.className = 'dragon-choice' + (dragon.id === currentId ? ' current' : '');
    choice.dataset.dragon = dragon.id;
    choice.innerHTML =
      `<span class="dragon-art"></span>` +
      `<span class="dragon-name">${dragon.name}</span>`;
    const lvl0 = dragon.levels[0];
    choice.querySelector('.dragon-art')
      .appendChild(art(lvl0.image, dragon.name, lvl0.fallback));
    if (dragon.id === currentId) choice.appendChild(currentBadge());
    choice.addEventListener('click', () => onPick(dragon.id));
    grid.appendChild(choice);
  }

  section.appendChild(grid);
  return section;
};
