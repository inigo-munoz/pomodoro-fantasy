import { english, named } from '../i18n/i18n.js';
import { coinHint } from './coinHint.js';
import { canAfford } from '../core/wallet.js';
import { backButton } from './backButton.js';
import { coinCounter } from './coinCounter.js';
import { art } from './art.js';
import { screenTitle } from './screenTitle.js';
import { themedIcon, localizeIcons } from './themedIcon.js';

export const renderShopScreen = ({ state, foods, theme, onBuy, onBack, t = english }) => {
  const section = document.createElement('section');
  section.className = 'screen shop';

  // Back on the left, what she can spend on the right: prices mean little without the purse.
  const bar = document.createElement('div');
  bar.className = 'screen-bar';
  bar.append(backButton(onBack, t), coinCounter(state.coins, theme));
  section.appendChild(bar);
  section.appendChild(screenTitle(t('shop.title')));

  const grid = document.createElement('div');
  grid.className = 'food-grid';

  for (const food of foods) {
    const affordable = canAfford(state.coins, food.price);
    const foodName = named(t, `food.${food.id}`, food.name);
    const card = document.createElement('button');
    card.className = 'food-card' + (affordable ? '' : ' dimmed');
    card.dataset.food = food.id;
    card.disabled = !affordable;
    card.innerHTML =
      `<span class="food-icon"></span>` +
      `<span class="food-name">${foodName}</span>` +
      `<span class="food-price"><span class="price-coin"></span> ${food.price}</span>` +
      `<span class="food-xp">+${food.xp} XP</span>`;
    const iconValue = theme?.foods?.[food.id] ?? food.icon;
    card.querySelector('.food-icon').appendChild(art(iconValue, foodName, food.fallback));
    card.querySelector('.price-coin').appendChild(themedIcon(theme, 'coin'));
    card.addEventListener('click', () => {
      if (affordable) onBuy(food);
    });
    grid.appendChild(card);
  }

  section.appendChild(grid);
  section.appendChild(coinHint(t));
  return localizeIcons(section, t);
};
