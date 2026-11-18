import { english } from '../i18n/i18n.js';

// Settings: type a gift code and get its coins. `onRedeem(text)` resolves to the result of
// core/giftCodes.js (status and coins); this panel only turns it into a line for the child.
export const renderGiftPanel = ({ onRedeem, t = english }) => {
  const panel = document.createElement('div');
  panel.className = 'settings-panel gift-panel';

  const title = document.createElement('h2');
  title.className = 'gift-title';
  title.textContent = t('gift.title');
  const lead = document.createElement('p');
  lead.className = 'gift-lead';
  lead.textContent = t('gift.lead');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'gift-input';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'characters');
  input.setAttribute('aria-label', t('gift.placeholder'));
  input.placeholder = t('gift.placeholder');

  const button = document.createElement('button');
  button.className = 'big-btn';
  button.dataset.action = 'redeem-gift';
  button.textContent = t('gift.redeem');

  const note = document.createElement('p');
  note.className = 'gift-note';
  note.setAttribute('role', 'status');

  let busy = false;
  const redeem = async () => {
    const text = input.value;
    if (!text.trim() || busy) return;
    busy = true;
    button.disabled = true;
    try {
      const result = await onRedeem(text);
      if (result?.status === 'gift') {
        note.textContent = t('gift.done', { count: result.coins });
        input.value = '';
      } else {
        note.textContent = t(result?.status === 'used' ? 'gift.used' : 'gift.unknown');
      }
    } finally {
      busy = false;
      button.disabled = false;
    }
  };
  button.addEventListener('click', redeem);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') redeem(); });

  const row = document.createElement('div');
  row.className = 'gift-row';
  row.append(input, button);
  panel.append(title, lead, row, note);
  return panel;
};
