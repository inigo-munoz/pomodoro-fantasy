import { art, paintBackdrop } from './art.js';
import { backButton } from './backButton.js';
import { screenTitle } from './screenTitle.js';

// The step between the title and the creature chooser. A family whose creatures have not
// shipped yet is still shown, disabled, so the screen reads complete from the start.
export const renderChooseFamily = ({ families, creatures, onPick, currentFamilyId, onBack, backdrop }) => {
  const section = document.createElement('section');
  section.className = 'screen choose-family';
  paintBackdrop(section, backdrop);

  if (onBack) section.appendChild(backButton(onBack));
  section.appendChild(screenTitle('Creatures'));

  const lead = document.createElement('p');
  lead.className = 'screen-lead';
  lead.textContent = 'Choose a family!';
  section.appendChild(lead);

  const grid = document.createElement('div');
  grid.className = 'family-grid';

  for (const family of families) {
    const ready = creatures.some((c) => c.family === family.id);
    const choice = document.createElement('button');
    choice.className = `family-choice family-${family.id}` + (family.id === currentFamilyId ? ' current' : '');
    choice.dataset.family = family.id;
    choice.disabled = !ready;

    const icon = document.createElement('span');
    icon.className = 'family-icon';
    icon.appendChild(art(family.image, family.name, family.icon));
    const name = document.createElement('span');
    name.className = 'family-name';
    name.textContent = family.name;
    const line = document.createElement('span');
    line.className = 'family-tagline';
    line.textContent = ready ? family.tagline : 'Coming soon';
    choice.append(icon, name, line);

    if (ready) choice.addEventListener('click', () => onPick(family.id));
    grid.appendChild(choice);
  }

  section.appendChild(grid);
  return section;
};
