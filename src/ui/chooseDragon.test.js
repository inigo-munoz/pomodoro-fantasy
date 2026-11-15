import { describe, it, expect, vi } from 'vitest';
import { renderChooseDragon } from './chooseDragon.js';
import { dragons } from '../data/dragons.js';
import { assetUrl } from './art.js';

describe('choose dragon screen', () => {
  it('renders a choice per dragon and reports the picked id', () => {
    const onPick = vi.fn();
    const el = renderChooseDragon({ dragons, onPick });
    const choices = el.querySelectorAll('.dragon-choice');
    expect(choices).toHaveLength(dragons.length);
    el.querySelector('[data-dragon="frost"]').click();
    expect(onPick).toHaveBeenCalledWith('frost');
  });

  it('paints the family backdrop behind the chooser, through assetUrl', () => {
    const family = { name: 'Cats', noun: 'cat', backdrop: '/art/backdrops/family-cats.webp' };
    const el = renderChooseDragon({ dragons, onPick: vi.fn(), family });
    expect(el.classList.contains('painted')).toBe(true);
    expect(el.style.getPropertyValue('--screen-backdrop'))
      .toBe(`url("${assetUrl('/art/backdrops/family-cats.webp')}")`);
  });

  it('keeps the plain background without a family, as before the family screen', () => {
    const el = renderChooseDragon({ dragons, onPick: vi.fn() });
    expect(el.classList.contains('painted')).toBe(false);
    expect(el.style.getPropertyValue('--screen-backdrop')).toBe('');
  });

  it('marks the current dragon when currentId is given', () => {
    const el = renderChooseDragon({ dragons, onPick: vi.fn(), currentId: 'frost' });
    expect(el.querySelector('[data-dragon="frost"]').classList.contains('current')).toBe(true);
    expect(el.querySelector('[data-dragon="blaze"]').classList.contains('current')).toBe(false);
  });

  it('names the screen "Dragons" and keeps the instruction as a lead line', () => {
    const el = renderChooseDragon({ dragons, onPick: vi.fn() });
    expect(el.querySelector('.screen-title').textContent).toBe('Dragons');
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    const lead = el.querySelector('p.screen-lead');
    expect(lead.textContent).toBe('Choose your dragon!');
    expect(el.querySelector('.screen-title').nextElementSibling).toBe(lead);
  });

  it('renders Back first, before the title, when given onBack, and calls it', () => {
    const onBack = vi.fn();
    const el = renderChooseDragon({ dragons, onPick: vi.fn(), onBack });
    const back = el.querySelector('button.back-btn');
    expect(back).not.toBeNull();
    expect(el.children[0]).toBe(back);
    expect(el.children[1].classList.contains('screen-title')).toBe(true);
    back.click();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders no Back without onBack, so the first-run chooser has nowhere to go back to', () => {
    const el = renderChooseDragon({ dragons, onPick: vi.fn() });
    expect(el.querySelector('.back-btn')).toBeNull();
    expect(el.children[0].classList.contains('screen-title')).toBe(true);
  });
});

describe('choose dragon screen, per family', () => {
  it('names the screen after the family and asks for one of its creatures', () => {
    const family = { id: 'cats', name: 'Cats', noun: 'cat' };
    const el = renderChooseDragon({ dragons: [], onPick: vi.fn(), family });
    expect(el.querySelector('.screen-title').textContent).toBe('Cats');
    expect(el.querySelector('p.screen-lead').textContent).toBe('Choose your cat!');
  });
});
