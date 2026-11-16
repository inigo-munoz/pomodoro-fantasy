import { describe, it, expect, vi } from 'vitest';
import { backButton } from './backButton.js';

describe('back button', () => {
  it('is a real button named Back, with an arrow icon the screen reader skips', () => {
    const btn = backButton(() => {});
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.type).toBe('button');
    expect(btn.getAttribute('aria-label')).toBe('Back');
    const icon = btn.querySelector('.back-icon');
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(btn.querySelector('.back-label').textContent).toBe('Back');
  });

  it('calls onBack when tapped', () => {
    const onBack = vi.fn();
    backButton(onBack).click();
    expect(onBack).toHaveBeenCalledOnce();
  });
});
