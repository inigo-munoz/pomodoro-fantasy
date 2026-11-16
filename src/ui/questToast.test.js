import { describe, it, expect, vi, afterEach } from 'vitest';
import { showQuestToast } from './questToast.js';

afterEach(() => { document.querySelectorAll('.quest-toast').forEach((t) => t.remove()); vi.useRealTimers(); });

describe('quest toast', () => {
  it('says which quest is done and what it paid, as a status message', () => {
    showQuestToast([{ title: 'Five blocks', reward: 10 }]);
    const toast = document.querySelector('.quest-toast');
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.textContent).toContain('Quest done!');
    expect(toast.textContent).toContain('Five blocks');
    expect(toast.textContent).toContain('+10');
  });

  it('lists several quests finished at once', () => {
    showQuestToast([{ title: 'Five blocks', reward: 10 }, { title: 'Three blocks', reward: 6 }]);
    const toast = document.querySelector('.quest-toast');
    expect(toast.textContent).toContain('2 quests done!');
    expect(toast.textContent).toContain('Three blocks');
  });

  it('goes away by itself, or when tapped', () => {
    vi.useFakeTimers();
    showQuestToast([{ title: 'A', reward: 1 }]);
    vi.advanceTimersByTime(5000);
    expect(document.querySelector('.quest-toast')).toBeNull();
    showQuestToast([{ title: 'B', reward: 1 }]);
    document.querySelector('.quest-toast').click();
    expect(document.querySelector('.quest-toast')).toBeNull();
  });

  it('shows nothing when nothing was paid', () => {
    showQuestToast([]);
    expect(document.querySelector('.quest-toast')).toBeNull();
  });
});
