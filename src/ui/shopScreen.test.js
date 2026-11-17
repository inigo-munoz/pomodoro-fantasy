import { describe, it, expect, vi } from 'vitest';
import { renderShopScreen } from './shopScreen.js';
import { assetUrl } from './art.js';
import { createTranslator } from '../i18n/i18n.js';
import { en } from '../i18n/en.js';
import { themes } from '../data/themes.js';
import { foods as catalogue } from '../data/foods.js';

const foods = [
  { id: 'apple', name: 'Apple', price: 10, xp: 20, icon: '🍎' },
  { id: 'cake',  name: 'Cake',  price: 50, xp: 150, icon: '🎂' },
];

describe('shop screen', () => {
  it('dims foods the player cannot afford and blocks their purchase', () => {
    const onBuy = vi.fn();
    const el = renderShopScreen({
      state: { coins: 10 }, foods, onBuy, onBack: () => {},
    });
    const cards = el.querySelectorAll('.food-card');
    expect(cards).toHaveLength(2);

    const cake = el.querySelector('[data-food="cake"]');
    expect(cake.classList.contains('dimmed')).toBe(true);
    cake.click();
    expect(onBuy).not.toHaveBeenCalled();
  });

  it('buys an affordable food on click', () => {
    const onBuy = vi.fn();
    const el = renderShopScreen({
      state: { coins: 10 }, foods, onBuy, onBack: () => {},
    });
    el.querySelector('[data-food="apple"]').click();
    expect(onBuy).toHaveBeenCalledWith(foods[0]);
  });

  it('renders themed food icons when a theme provides them', () => {
    const theme = { icons: { coin: '/art/icons/coin.webp' },
      foods: { apple: '/art/foods/apple.webp' } };
    const el = renderShopScreen({
      state: { coins: 100 }, foods, theme, onBuy: () => {}, onBack: () => {},
    });
    const appleIcon = el.querySelector('[data-food="apple"] .food-icon img.art-img');
    expect(appleIcon).not.toBeNull();
    expect(appleIcon.getAttribute('src')).toBe(assetUrl('/art/foods/apple.webp'));
  });

  it('names the screen "Shop", right under the bar holding the back button', () => {
    const el = renderShopScreen({ state: { coins: 10 }, foods, onBuy: vi.fn(), onBack: () => {} });
    expect(el.querySelector('.screen-title').textContent).toBe('Shop');
    expect(el.children[0].classList.contains('screen-bar')).toBe(true);
    expect(el.children[0].querySelector('.back-btn')).not.toBeNull();
    expect(el.children[1].classList.contains('screen-title')).toBe(true);
    expect(el.children[1].classList.contains('screen-title')).toBe(true);
  });

  it('shows how many coins she has, with the back button first in the bar', () => {
    const el = renderShopScreen({
      state: { coins: 37 }, foods, onBuy: () => {}, onBack: () => {},
    });
    const bar = el.querySelector('.screen-bar');
    expect(bar.querySelector('.coin-counter').textContent).toContain('37');
    expect(bar.firstElementChild.classList.contains('back-btn')).toBe(true);
  });
});

// Where coins come from, said the same way whatever the purse: a line that only appeared when
// she is short would read as a nudge about it (the rule the Lair offer already keeps).
describe('shop screen hint', () => {
  it.each([0, 3, 10, 500])('says where coins come from, the same with %i coins', (coins) => {
    const el = renderShopScreen({ state: { coins }, foods, onBuy: vi.fn(), onBack: () => {} });
    expect(el.querySelector('.screen-hint').textContent).toBe('Every study block you finish earns coins.');
  });

  it('names a food after what its world shows, in the chosen language', () => {
    const meat = [{ id: 'meat', name: 'Meat', price: 25, xp: 60, icon: '🍖' }];
    const name = (themeId, lang) => renderShopScreen({
      state: { coins: 0 }, foods: meat, themeId, t: createTranslator(lang), onBuy: () => {}, onBack: () => {},
    }).querySelector('.food-name').textContent;
    expect(name('coral', 'en')).toBe('Fish skewer');
    expect(name('coral', 'es')).toBe('Brocheta de pescado');
    expect(name('nebula', 'es')).toBe('Tréboles de estrellas');
  });

  it('keeps the plain food name in a world that has none of its own', () => {
    const meat = [{ id: 'meat', name: 'Meat', price: 25, xp: 60, icon: '🍖' }];
    const name = (themeId, lang) => renderShopScreen({
      state: { coins: 0 }, foods: meat, themeId, t: createTranslator(lang), onBuy: () => {}, onBack: () => {},
    }).querySelector('.food-name').textContent;
    expect(name('blaze', 'es')).toBe('Carne');
    expect(name(undefined, 'en')).toBe('Meat');
  });

  it('only names foods of worlds and foods that exist', () => {
    const ids = new Set(catalogue.map((f) => f.id));
    const own = Object.keys(en).filter((k) => /^food\.[^.]+\.[^.]+$/.test(k));
    expect(own.length).toBeGreaterThan(0);
    for (const key of own) {
      const [, themeId, foodId] = key.split('.');
      expect(Object.hasOwn(themes, themeId), key).toBe(true);
      expect(ids.has(foodId), key).toBe(true);
    }
  });
});
