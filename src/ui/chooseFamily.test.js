import { describe, it, expect, vi } from 'vitest';
import { renderChooseFamily } from './chooseFamily.js';
import { families } from '../data/families.js';
import { assetUrl } from './art.js';

const creatures = [
  { id: 'frost', family: 'dragons' },
  { id: 'luna', family: 'cats' },
];

const render = (extra = {}) =>
  renderChooseFamily({ families, creatures, onPick: vi.fn(), ...extra });

describe('choose family screen', () => {
  it('paints the given backdrop behind the screen, through assetUrl', () => {
    const el = render({ backdrop: '/art/backdrops/families.webp' });
    expect(el.classList.contains('painted')).toBe(true);
    expect(el.style.getPropertyValue('--screen-backdrop'))
      .toBe(`url("${assetUrl('/art/backdrops/families.webp')}")`);
  });

  it('keeps the plain screen background when no backdrop is given', () => {
    const el = render();
    expect(el.classList.contains('painted')).toBe(false);
    expect(el.style.getPropertyValue('--screen-backdrop')).toBe('');
  });

  it('renders one choice per family, with its name and theme line', () => {
    const el = render();
    const choices = el.querySelectorAll('.family-choice');
    expect(choices).toHaveLength(families.length);
    const cats = el.querySelector('[data-family="cats"]');
    expect(cats.querySelector('.family-name').textContent).toBe('Cats');
    expect(cats.textContent).toContain(families[1].tagline);
  });

  it('shows the family picture with its name as alt text, and keeps the emoji as fallback', () => {
    const icon = render().querySelector('[data-family="cats"] .family-icon');
    const img = icon.querySelector('img');
    expect(img.getAttribute('src')).toBe(assetUrl(families[1].image));
    expect(img.alt).toBe('Cats');
    img.dispatchEvent(new Event('error'));
    expect(icon.textContent).toBe(families[1].icon);
  });

  it('reports the picked family id', () => {
    const onPick = vi.fn();
    render({ onPick }).querySelector('[data-family="cats"]').click();
    expect(onPick).toHaveBeenCalledWith('cats');
  });

  it('shows a family with no creatures yet as coming soon, and does not open it', () => {
    const onPick = vi.fn();
    const wolves = render({ onPick }).querySelector('[data-family="wolves"]');
    expect(wolves.disabled).toBe(true);
    expect(wolves.textContent).toContain('Coming soon');
    wolves.click();
    expect(onPick).not.toHaveBeenCalled();
  });

  it('marks the family of the creature in play', () => {
    const el = render({ currentFamilyId: 'dragons' });
    expect(el.querySelector('[data-family="dragons"]').classList.contains('current')).toBe(true);
    expect(el.querySelector('[data-family="cats"]').classList.contains('current')).toBe(false);
  });

  it('names the screen and renders Back first only when given onBack', () => {
    const onBack = vi.fn();
    const el = render({ onBack });
    expect(el.children[0]).toBe(el.querySelector('button.back-btn'));
    expect(el.querySelector('.screen-title').textContent).toBe('Creatures');
    expect(el.querySelector('p.screen-lead').textContent).toBe('Choose a family!');
    el.querySelector('.back-btn').click();
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(render().querySelector('.back-btn')).toBeNull();
  });
});

describe('choose family screen: the current family', () => {
  it('labels the current family as Yours, and no other', () => {
    const el = renderChooseFamily({ families, creatures, onPick: vi.fn(), currentFamilyId: 'cats' });
    expect(el.querySelector('[data-family="cats"] .current-badge').textContent).toBe('Yours');
    expect(el.querySelectorAll('.current-badge')).toHaveLength(1);
  });
});
