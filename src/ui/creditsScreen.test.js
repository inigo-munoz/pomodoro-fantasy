import { describe, it, expect, vi } from 'vitest';
import { renderCreditsScreen } from './creditsScreen.js';
import { credits } from '../data/credits.js';

const render = (onBack = vi.fn()) => renderCreditsScreen({ credits, onBack });

describe('credits screen', () => {
  it('is titled Credits and goes back', () => {
    const onBack = vi.fn();
    const el = render(onBack);
    expect(el.querySelector('.screen-title').textContent).toBe('Credits');
    el.querySelector('.back-btn').click();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('shows every section and every entry with its title, author and licence', () => {
    const el = render();
    expect([...el.querySelectorAll('.credits-section h2')].map((h) => h.textContent))
      .toEqual(credits.map((s) => s.section));
    const shown = el.querySelectorAll('.credit');
    expect(shown).toHaveLength(credits.flatMap((s) => s.items).length);
    expect(el.textContent).toContain("Towball's Crossing Deluxe");
    expect(el.textContent).toContain('Towball');
    expect(el.textContent).toContain('CC BY 4.0');
    expect(el.textContent).toContain('towball.itch.io/towballs-crossing-deluxe');
  });

  // A children's app should not send the child out to the web: addresses are text, not links.
  it('has no links that leave the app', () => {
    expect(render().querySelectorAll('a[href]')).toHaveLength(0);
  });
});
