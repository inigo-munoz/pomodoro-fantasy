import { describe, it, expect, vi } from 'vitest';
import { renderGiftPanel } from './giftPanel.js';
import { createTranslator } from '../i18n/i18n.js';

const flush = () => new Promise((r) => setTimeout(r, 0));

const setup = (answer, lang = 'en') => {
  const onRedeem = vi.fn(async () => answer);
  const el = renderGiftPanel({ onRedeem, t: createTranslator(lang) });
  const type = async (text) => {
    el.querySelector('input.gift-input').value = text;
    el.querySelector('[data-action="redeem-gift"]').click();
    await flush();
  };
  const note = () => el.querySelector('.gift-note').textContent;
  return { el, onRedeem, type, note };
};

describe('gift panel', () => {
  it('sends what was typed and says how many coins arrived, then clears the field', async () => {
    const { el, onRedeem, type, note } = setup({ status: 'gift', coins: 100 });
    await type('testgift7');
    expect(onRedeem).toHaveBeenCalledWith('testgift7');
    expect(note()).toBe('You got 100 coins!');
    expect(el.querySelector('input.gift-input').value).toBe('');
  });

  it('says so when the code was already used in this game', async () => {
    const { type, note } = setup({ status: 'used' });
    await type('testgift7');
    expect(note()).toBe('This code has already been used in this game.');
  });

  it('says so when the code does not exist, keeping what was typed to fix it', async () => {
    const { el, type, note } = setup({ status: 'unknown' });
    await type('testgift');
    expect(note()).toBe("That code doesn't exist. Check how it's written.");
    expect(el.querySelector('input.gift-input').value).toBe('testgift');
  });

  it('speaks Spanish', async () => {
    const { el, type, note } = setup({ status: 'gift', coins: 100 }, 'es');
    expect(el.querySelector('.gift-title').textContent).toBe('Código de regalo');
    await type('testgift7');
    expect(note()).toBe('¡Has recibido 100 monedas!');
  });

  it('does nothing with an empty field', async () => {
    const { onRedeem, type } = setup({ status: 'unknown' });
    await type('   ');
    expect(onRedeem).not.toHaveBeenCalled();
  });
});
