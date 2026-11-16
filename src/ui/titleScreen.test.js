import { describe, it, expect, vi } from 'vitest';
import { renderTitleScreen } from './titleScreen.js';

const render = (over = {}) =>
  renderTitleScreen({ onStart: vi.fn(), onInstructions: vi.fn(), ...over });

describe('title screen', () => {
  it('is the title screen and carries the name of the app as its hero', () => {
    const el = render();
    expect(el.className).toBe('screen title');
    const name = el.querySelector('.app-title');
    expect(name.textContent).toBe('Pomodoro Fantasy');
    // The app's own name, not a chapter watermark like the other screens.
    expect(el.querySelector('.screen-title')).toBeNull();
  });

  it('has a primary Start button that fires onStart', () => {
    const onStart = vi.fn();
    const start = render({ onStart }).querySelector('[data-action="start-app"]');
    expect(start.classList.contains('big-btn')).toBe(true);
    expect(start.classList.contains('primary')).toBe(true);
    start.click();
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('has an instructions link that fires onInstructions, not onStart', () => {
    const onStart = vi.fn();
    const onInstructions = vi.fn();
    const link = render({ onStart, onInstructions }).querySelector('[data-action="instructions"]');
    link.click();
    expect(onInstructions).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });

  it('renders with no dragon and no theme: it only needs its two callbacks', () => {
    expect(() => renderTitleScreen({ onStart: () => {}, onInstructions: () => {} })).not.toThrow();
  });

  it('uses no punitive copy', () => {
    expect(render().textContent).not.toMatch(/hungry|lost|missed|neglect|streak|warning/i);
  });
});

describe('title screen credits', () => {
  it('has a Credits link that fires onCredits', () => {
    const onCredits = vi.fn();
    const el = renderTitleScreen({ onStart: vi.fn(), onInstructions: vi.fn(), onCredits });
    el.querySelector('[data-action="credits"]').click();
    expect(onCredits).toHaveBeenCalledOnce();
  });
});

describe('title screen with a creature in play', () => {
  it('offers to carry on with it in one tap, and still lets the child choose another', () => {
    const onContinue = vi.fn();
    const onStart = vi.fn();
    const el = render({ onStart, continueWith: { name: 'Frost', onContinue } });
    const carryOn = el.querySelector('[data-action="continue"]');
    expect(carryOn.textContent).toBe('Continue with Frost');
    expect(carryOn.className).toContain('primary');
    carryOn.click();
    expect(onContinue).toHaveBeenCalledOnce();
    const other = el.querySelector('[data-action="start-app"]');
    expect(other.textContent).toBe('Choose a creature');
    expect(other.className).not.toContain('primary');
    other.click();
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('keeps the single Start button when there is no creature yet', () => {
    const el = render();
    expect(el.querySelector('[data-action="continue"]')).toBeNull();
    expect(el.querySelector('[data-action="start-app"]').textContent).toBe('Start');
  });
});

describe('title screen layout', () => {
  it('shows the creature in play above Continue, named for screen readers', () => {
    const el = render({ continueWith: { name: 'Coral', image: '/art/cats/coral-baby.webp', onContinue: vi.fn() } });
    const portrait = el.querySelector('.title-creature img');
    expect(portrait.getAttribute('alt')).toBe('Coral');
    const order = [...el.querySelectorAll('.title-creature, [data-action="continue"]')];
    expect(order.map((n) => n.className.includes('title-creature'))).toEqual([true, false]);
  });

  it('groups the main actions, and puts How it works and Credits side by side in a footer', () => {
    const el = render({ onCredits: vi.fn(), continueWith: { name: 'Coral', onContinue: vi.fn() } });
    const actions = el.querySelector('.title-actions');
    expect(actions.querySelector('[data-action="continue"]')).not.toBeNull();
    expect(actions.querySelector('[data-action="start-app"]')).not.toBeNull();
    const footer = el.querySelector('.title-footer');
    expect([...footer.querySelectorAll('button')].map((b) => b.dataset.action)).toEqual(['instructions', 'credits']);
  });
});
