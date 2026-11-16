import { english, named } from '../i18n/i18n.js';
import { backButton } from './backButton.js';
import { screenTitle } from './screenTitle.js';

const line = (className, text) => {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  return p;
};

// Who made the music, sounds and font. Addresses are plain text, never links: a children's
// app should not send the child out to the web, and an adult can still read and type them.
export const renderCreditsScreen = ({ credits, onBack, t = english }) => {
  const section = document.createElement('section');
  section.className = 'screen credits';
  section.append(backButton(onBack, t), screenTitle(t('credits.title')));

  for (const group of credits) {
    const block = document.createElement('div');
    block.className = 'credits-section';
    const heading = document.createElement('h2');
    heading.textContent = named(t, `credits.section.${group.id}`, group.section);
    block.appendChild(heading);
    for (const item of group.items) {
      const card = document.createElement('div');
      card.className = 'credit food-card';
      card.append(line('credit-title', item.title), line('credit-author', t('credits.by', { author: item.author })));
      const licence = item.licenceUrl ? `${item.licence} (${item.licenceUrl})` : item.licence;
      card.append(line('credit-licence', licence));
      if (item.source) card.append(line('credit-source', item.source));
      if (item.changes) card.append(line('credit-changes', named(t, `credits.changes.${item.id}`, item.changes)));
      block.appendChild(card);
    }
    section.appendChild(block);
  }
  return section;
};
