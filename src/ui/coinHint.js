import { english } from '../i18n/i18n.js';
// Where coins come from, under the shop and the Lair offer. Always the same words, whatever
// the purse: a line that only appeared when she is short would read as a nudge about it.
export const coinHint = (t = english) => {
  const hint = document.createElement('p');
  hint.className = 'screen-hint';
  hint.textContent = t('common.coinHint');
  return hint;
};
