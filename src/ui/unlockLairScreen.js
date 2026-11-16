import { english } from '../i18n/i18n.js';
import { coinHint } from './coinHint.js';
import { canAfford } from '../core/wallet.js';
import { backButton } from './backButton.js';
import { coinCounter } from './coinCounter.js';
import { art } from './art.js';
import { defaultRoom } from '../core/theme.js';
import { screenTitle } from './screenTitle.js';
import { themedIcon, localizeIcons } from './themedIcon.js';

// A pure render: opening, reading and closing the offer cannot touch coins or the flag.
// onConfirm is the only path that changes state.
export const renderUnlockLair = ({ state, price, theme, onConfirm, onBack, t = english }) => {
  const section = document.createElement('section');
  section.className = 'screen unlock';
  // Back on the left, the purse on the right, as in the shop: what she has is what the offer asks.
  const bar = document.createElement('div');
  bar.className = 'screen-bar';
  bar.append(backButton(onBack, t), coinCounter(state.coins, theme));
  section.appendChild(bar);
  section.appendChild(screenTitle(t('unlock.title')));

  const card = document.createElement('div');
  card.className = 'unlock-card';
  card.innerHTML =
    `<p class="unlock-title">${t('unlock.heading')}</p>` +
    `<div class="unlock-art"></div>` +
    `<p class="unlock-blurb">${t('unlock.blurb')}</p>`;

  // The room she is saving for, through art() so the path goes through assetUrl() and an
  // emoji or a missing room still renders. Skipped without a room: the card stays a panel.
  if (theme?.room) card.querySelector('.unlock-art').appendChild(art(theme.room, '', defaultRoom));

  const affordable = canAfford(state.coins, price);
  const btn = document.createElement('button');
  btn.className = 'big-btn primary' + (affordable ? '' : ' dimmed');
  btn.dataset.action = 'unlock-confirm';
  btn.disabled = !affordable;
  // The coin goes straight into the button, not in a .price-coin wrapper: that wrapper's
  // rule outranks .big-btn .art-img by source order and would oversize it.
  btn.append(`${t('unlock.open')} `, themedIcon(theme, 'coin'), ` ${price}`);
  btn.addEventListener('click', () => { if (affordable) onConfirm(); });
  card.appendChild(btn);

  section.appendChild(card);
  section.appendChild(coinHint(t));
  return localizeIcons(section, t);
};
