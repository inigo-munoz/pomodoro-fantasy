import { describe, it, expect, vi } from 'vitest';
import { renderRecordScreen } from './recordScreen.js';
import { quests } from '../data/quests.js';
import { furniture, slots } from '../data/furniture.js';
import { dragons } from '../data/dragons.js';
import { weeklyPool } from '../data/quests/weekly.js';
import { weekKey } from '../core/weekly.js';

// Friday 2 October 2026, local, so the week runs Mon 28 Sep .. Sun 4 Oct.
const now = new Date(2026, 9, 2, 18, 0).getTime();

// The lifetime counter is its own field in the save. By default it equals what the history
// sums to, which is the honest state of a player whose window still holds everything.
const sumBlocks = (history) => Object.values(history).reduce((n, d) => n + d.blocks, 0);
const ctx = (history = {}, over = {}) => ({
  state: { coins: 12, history, lifetimeBlocks: sumBlocks(history) },
  now,
  theme: { icons: {} },
  onBack: vi.fn(),
  ...over,
});

const days = (el) => [...el.querySelectorAll('[data-day]')];
const weeks = (el) => [...el.querySelectorAll('[data-week]')];
const rangeBtn = (el, range) => el.querySelector(`[data-range="${range}"]`);
const GUILT = /hungry|lost|missed|neglect|streak|warning/i;

describe('record screen', () => {
  it('follows the other screens: bar with back and coins, then a Record title', () => {
    const el = renderRecordScreen(ctx());
    expect(el.className).toBe('screen record');
    expect(el.querySelector('.screen-bar .back-btn')).not.toBeNull();
    expect(el.querySelector('.screen-bar .coin-counter').textContent).toContain('12');
    expect(el.querySelector('.screen-title').textContent).toBe('Record');
  });

  it('the back button calls onBack', () => {
    const onBack = vi.fn();
    renderRecordScreen(ctx({}, { onBack })).querySelector('.back-btn').click();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows the calendar week, Monday first, with fixed English labels', () => {
    const el = renderRecordScreen(ctx());
    expect(days(el).map((d) => d.dataset.day)).toEqual([
      '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01',
      '2026-10-02', '2026-10-03', '2026-10-04',
    ]);
    // Friday is today: Sat and Sun are still to come and carry no label text.
    expect(days(el).slice(0, 5).map((d) => d.querySelector('.record-day-name').textContent))
      .toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  });

  it('labels all seven days Mon..Sun in order once the week is over', () => {
    const sunday = new Date(2026, 9, 4, 20, 0).getTime();
    const el = renderRecordScreen(ctx({}, { now: sunday }));
    expect(days(el).map((d) => d.querySelector('.record-day-name').textContent))
      .toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('marks today, and only today', () => {
    const el = renderRecordScreen(ctx());
    const marked = el.querySelectorAll('.is-today');
    expect(marked).toHaveLength(1);
    expect(marked[0].dataset.day).toBe('2026-10-02');
    expect(marked[0].getAttribute('aria-current')).toBe('date');
  });

  it('marks the days after today as future, with no number and no text at all', () => {
    const el = renderRecordScreen(ctx({ '2026-10-02': { blocks: 2, minutes: 50 } }));
    const future = el.querySelectorAll('.is-future');
    expect([...future].map((d) => d.dataset.day)).toEqual(['2026-10-03', '2026-10-04']);
    for (const d of future) {
      expect(d.className).toContain('record-day');
      expect(d.textContent).toBe('');
      expect(d.querySelector('.record-count').textContent).toBe('');
      expect(d.getAttribute('aria-label')).not.toMatch(/\d/);
    }
    expect(el.querySelector('.is-today').classList.contains('is-future')).toBe(false);
  });

  it('shows each day\'s count and a bar that grows with the blocks', () => {
    const el = renderRecordScreen(ctx({
      '2026-10-02': { blocks: 4, minutes: 100 },
      '2026-10-01': { blocks: 2, minutes: 50 },
    }));
    const [today, yesterday] = [days(el)[4], days(el)[3]];
    expect(today.querySelector('.record-count').textContent).toBe('4');
    expect(yesterday.querySelector('.record-count').textContent).toBe('2');
    const h = (d) => parseFloat(d.querySelector('.record-bar').style.height);
    expect(h(today)).toBe(100);
    expect(h(yesterday)).toBe(50);
  });

  it('renders a past day with nothing as a plain zero, with no message and no bar', () => {
    const el = renderRecordScreen(ctx({ '2026-10-02': { blocks: 1, minutes: 25 } }));
    const empty = days(el)[0]; // Monday, a past day
    expect(empty.querySelector('.record-count').textContent).toBe('0');
    expect(parseFloat(empty.querySelector('.record-bar').style.height)).toBe(0);
    expect(empty.textContent).toBe('0Mon');
  });

  it('renders a whole empty week without any message', () => {
    const el = renderRecordScreen(ctx());
    expect(days(el)).toHaveLength(7);
    expect(el.querySelector('.record-total').textContent).toBe('You have finished 0 blocks in all.');
  });

  it('words the all-time total as something she did, over the whole history', () => {
    const el = renderRecordScreen(ctx({
      '2026-08-01': { blocks: 10, minutes: 250 },
      '2026-10-02': { blocks: 3, minutes: 75 },
    }));
    expect(el.querySelector('.record-total').textContent).toBe('You have finished 13 blocks in all.');
  });

  it('reads the total from the lifetime counter, not from the days still in the history', () => {
    // 60 days of history have been pruned away: only 3 blocks are visible, 130 were finished.
    const el = renderRecordScreen({
      ...ctx({ '2026-10-02': { blocks: 3, minutes: 75 } }),
      state: { coins: 12, history: { '2026-10-02': { blocks: 3, minutes: 75 } }, lifetimeBlocks: 130 },
    });
    expect(el.querySelector('.record-total').textContent).toBe('You have finished 130 blocks in all.');
  });

  it('says 0 blocks when the save has no lifetime counter at all', () => {
    const el = renderRecordScreen({ ...ctx(), state: { coins: 12, history: {} } });
    expect(el.querySelector('.record-total').textContent).toBe('You have finished 0 blocks in all.');
  });

  it('says "block" for exactly one', () => {
    const el = renderRecordScreen(ctx({ '2026-10-02': { blocks: 1, minutes: 25 } }));
    expect(el.querySelector('.record-total').textContent).toBe('You have finished 1 block in all.');
  });

  it('never uses the language of guilt, with or without history (frozen product decision)', () => {
    const full = {
      '2026-10-02': { blocks: 4, minutes: 100 },
      '2026-09-30': { blocks: 1, minutes: 25 },
    };
    for (const history of [{}, full]) {
      const el = renderRecordScreen(ctx(history));
      expect(el.textContent).not.toMatch(/hungry|lost|missed|neglect|streak|warning/i);
      expect(el.innerHTML).not.toMatch(/hungry|lost|missed|neglect|streak|warning/i);
    }
  });
});

describe('record screen range', () => {
  const history = {
    '2026-10-02': { blocks: 4, minutes: 100 },
    '2026-10-01': { blocks: 2, minutes: 50 },
    '2026-09-30': { blocks: 7, minutes: 175 }, // September, same week as 1 Oct
  };

  it('offers Week and Month as buttons of the preset family, Week active on opening', () => {
    const el = renderRecordScreen(ctx(history));
    const week = rangeBtn(el, 'week');
    const month = rangeBtn(el, 'month');
    expect(week.tagName).toBe('BUTTON');
    expect(week.textContent).toBe('Week');
    expect(month.textContent).toBe('Month');
    expect(week.className).toContain('preset');
    expect(month.className).toContain('preset');
    expect(week.classList.contains('active')).toBe(true);
    expect(month.classList.contains('active')).toBe(false);
    expect(week.getAttribute('aria-pressed')).toBe('true');
    expect(month.getAttribute('aria-pressed')).toBe('false');
    expect(days(el)).toHaveLength(7);
    expect(weeks(el)).toHaveLength(0);
  });

  it('switching to the month redraws one bar per week and moves the active mark', () => {
    const el = renderRecordScreen(ctx(history));
    rangeBtn(el, 'month').click();
    expect(weeks(el).map((w) => w.dataset.week)).toEqual([
      '2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26',
    ]);
    expect(days(el)).toHaveLength(0);
    expect(weeks(el).map((w) => w.querySelector('.record-day-name').textContent))
      .toEqual(['1-4', '', '', '', '']); // weeks still to come carry no text, like future days
    expect(rangeBtn(el, 'month').classList.contains('active')).toBe(true);
    expect(rangeBtn(el, 'week').classList.contains('active')).toBe(false);
    expect(rangeBtn(el, 'month').getAttribute('aria-pressed')).toBe('true');
  });

  it('switches back to the week, and leaves a single chart on screen each time', () => {
    const el = renderRecordScreen(ctx(history));
    rangeBtn(el, 'month').click();
    rangeBtn(el, 'week').click();
    expect(days(el)).toHaveLength(7);
    expect(weeks(el)).toHaveLength(0);
    expect(el.querySelectorAll('.record-week')).toHaveLength(1);
    expect(el.querySelectorAll('[data-range]')).toHaveLength(2);
  });

  it('totals the in-month days of the current week, marks it, and leaves later weeks blank', () => {
    const el = renderRecordScreen(ctx(history));
    rangeBtn(el, 'month').click();
    const [first, ...rest] = weeks(el);
    expect(first.querySelector('.record-count').textContent).toBe('6'); // 2 + 4, not the 7 in September
    expect(first.classList.contains('is-current')).toBe(true);
    expect(first.getAttribute('aria-current')).toBe('date');
    expect(el.querySelectorAll('.is-current')).toHaveLength(1);
    for (const w of rest) {
      expect(w.classList.contains('is-future')).toBe(true);
      expect(w.querySelector('.record-count').textContent).toBe('');
      expect(w.textContent).toBe('');
      expect(w.getAttribute('aria-label')).not.toMatch(/block/); // a span, never a count
    }
  });

  it('shows a 0 on every past week with nothing, and scales bars to the best week', () => {
    const late = new Date(2026, 9, 28, 12).getTime(); // Wednesday of the 26-31 week
    const el = renderRecordScreen(ctx({
      '2026-10-06': { blocks: 8, minutes: 200 },
      '2026-10-27': { blocks: 4, minutes: 100 },
    }, { now: late }));
    rangeBtn(el, 'month').click();
    expect(weeks(el).map((w) => w.querySelector('.record-count').textContent))
      .toEqual(['0', '8', '0', '0', '4']);
    const h = (w) => parseFloat(w.querySelector('.record-bar').style.height);
    expect(weeks(el).map(h)).toEqual([0, 100, 0, 0, 50]);
  });

  it('shows a 0 on a past day with nothing in the week too, and a 0 in an empty month', () => {
    const el = renderRecordScreen(ctx());
    const counts = days(el).map((d) => d.querySelector('.record-count').textContent);
    expect(counts).toEqual(['0', '0', '0', '0', '0', '', '']);
    rangeBtn(el, 'month').click();
    expect(weeks(el).map((w) => w.querySelector('.record-count').textContent))
      .toEqual(['0', '', '', '', '']);
  });

  it('keeps the all-time total unchanged by the range', () => {
    const el = renderRecordScreen(ctx(history));
    const before = el.querySelector('.record-total').textContent;
    rangeBtn(el, 'month').click();
    expect(el.querySelector('.record-total').textContent).toBe(before);
    expect(before).toBe('You have finished 13 blocks in all.');
  });

  it('opens on the week again on every render: the choice is not remembered', () => {
    const first = renderRecordScreen(ctx(history));
    rangeBtn(first, 'month').click();
    const second = renderRecordScreen(ctx(history));
    expect(rangeBtn(second, 'week').classList.contains('active')).toBe(true);
    expect(days(second)).toHaveLength(7);
  });

  it('never uses the language of guilt, in either view, with or without history', () => {
    for (const h of [{}, history]) {
      const el = renderRecordScreen(ctx(h));
      for (const range of ['week', 'month']) {
        rangeBtn(el, range).click();
        expect(el.textContent).not.toMatch(GUILT);
        expect(el.innerHTML).not.toMatch(GUILT);
      }
    }
  });

  it('draws no target, average or comparison in either view', () => {
    const el = renderRecordScreen(ctx(history));
    for (const range of ['week', 'month']) {
      rangeBtn(el, range).click();
      expect(el.textContent).not.toMatch(/goal|target|average|avg|best|record of|vs|%/i);
    }
  });
});

describe('work that lands in the future is still shown', () => {
  // A tablet whose clock was running fast records blocks on a date that becomes "the future"
  // once the clock is corrected. That is real work and must not vanish from the chart: a blank
  // bar would read as if she had never done it. Today is Fri 2 Oct, so Sun 4 Oct is ahead.
  it('prints the count on a future day that somehow has blocks', () => {
    const el = renderRecordScreen(ctx({ '2026-10-04': { blocks: 3, minutes: 45 } }));
    const sunday = days(el).find((d) => d.dataset.day === '2026-10-04');
    expect(sunday.querySelector('.record-count').textContent).toBe('3');
  });

  it('still leaves a genuinely empty future day blank', () => {
    const el = renderRecordScreen(ctx());
    const blanks = days(el).filter((d) => d.classList.contains('is-future'));
    expect(blanks.length).toBeGreaterThan(0);
    expect(blanks.every((d) => d.querySelector('.record-count').textContent === '')).toBe(true);
  });

  it('does the same for a future week in the month view', () => {
    const el = renderRecordScreen(ctx({ '2026-10-31': { blocks: 4, minutes: 60 } }));
    rangeBtn(el, 'month').click();
    const last = weeks(el).at(-1);
    expect(last.querySelector('.record-count').textContent).toBe('4');
  });
});

describe('record screen: quest ladder', () => {
  const world = { furniture, slots, dragons };
  const qctx = (state = {}, over = {}) => ctx({}, {
    state: { coins: 12, history: {}, lifetimeBlocks: 0, ...state }, quests, world, ...over,
  });
  const entry = (el, id) => el.querySelector(`[data-quest="${id}"]`);
  const DEADLINE = /expire|deadline|\\blate\\b|fail|overdue|hurry|only \d+ (days|hours)|time('s| is) up/i;

  const listed = (el) => [...el.querySelectorAll('.quest-list [data-quest]')].map((e) => e.dataset.quest);

  // The ladder is long (dozens of rungs), so the screen shows what is next, not all of it:
  // the first unfinished rung of each theme (blocks, lair, creatures, families), then the next
  // unfinished ones in catalogue order, five in all.
  const theme = (q) => (q.family || q.kind === 'everyFamily' ? 'families'
    : q.kind === 'blocks' ? 'blocks'
      : ['growing', 'fullGrown', 'reached'].includes(q.kind) ? 'creatures' : 'lair');

  it('shows five next rungs, one of each theme first, under the chart and the total', () => {
    const el = renderRecordScreen(qctx());
    const ids = listed(el);
    expect(ids.length).toBe(5);
    const shown = ids.map((id) => quests.find((q) => q.id === id));
    for (const t of ['blocks', 'lair', 'creatures', 'families']) {
      expect(shown).toContain(quests.find((q) => theme(q) === t));
    }
    expect(ids).toEqual([...ids].sort((a, b) => quests.findIndex((q) => q.id === a) - quests.findIndex((q) => q.id === b)));
    const order = [...el.children];
    const list = el.querySelector('.quest-list');
    expect(order.indexOf(list)).toBeGreaterThan(order.indexOf(el.querySelector('.record-total')));
    expect(order.indexOf(el.querySelector('.record-week'))).toBeLessThan(order.indexOf(list));
  });

  it('shows each quest\'s title and its coin reward with the coin art', () => {
    const e = entry(renderRecordScreen(qctx({ lifetimeBlocks: 12 })), 'blocks-25');
    expect(e.querySelector('.quest-title').textContent).toBe(quests.find((q) => q.id === 'blocks-25').title);
    expect(e.querySelector('.quest-reward').textContent).toContain(String(quests.find((q) => q.id === 'blocks-25').reward));
    expect(e.querySelector('.quest-reward .art-emoji, .quest-reward .art-img')).not.toBeNull();
  });

  it('leaves finished rungs off the list and counts them in the summary', () => {
    const el = renderRecordScreen(qctx({ lifetimeBlocks: 12 }));
    expect(entry(el, 'blocks-10')).toBeNull();
    const done = quests.filter((q) => q.kind === 'blocks' && q.goal <= 12).length;
    expect(el.querySelector('.quest-summary').textContent).toBe(`${done} of ${quests.length} quests done`);
  });

  it('shows how far the next rung has come, marked as in progress', () => {
    const el = renderRecordScreen(qctx({ lifetimeBlocks: 12 }));
    const doing = entry(el, 'blocks-25');
    expect(doing.dataset.state).toBe('doing');
    expect(doing.querySelector('.quest-progress').textContent).toBe('12 / 25');
    expect(doing.querySelector('.quest-mark')).toBeNull();
  });

  it('shows an untouched quest as 0 / goal, still just in progress', () => {
    const el = renderRecordScreen(qctx());
    expect(entry(el, 'blocks-1').dataset.state).toBe('doing');
    expect(entry(el, 'blocks-1').querySelector('.quest-progress').textContent).toBe('0 / 1');
  });

  it('counts a quest as done by what she did, not by what has been paid', () => {
    const el = renderRecordScreen(qctx({ lifetimeBlocks: 1, questsPaid: [] }));
    expect(entry(el, 'blocks-1')).toBeNull();
    expect(el.querySelector('.quest-summary').textContent).toBe(`1 of ${quests.length} quests done`);
  });

  it('says so, without a list, when every quest is done', () => {
    const one = [quests[0]];
    const el = renderRecordScreen(qctx({ lifetimeBlocks: 1 }, { quests: one }));
    expect(el.querySelector('.quest-summary').textContent).toBe('1 of 1 quests done');
    expect(listed(el)).toEqual([]);
  });

  it('keeps the chart, the range switch and the lifetime total as they were', () => {
    const el = renderRecordScreen(qctx({ lifetimeBlocks: 7 }));
    expect(days(el)).toHaveLength(7);
    expect(rangeBtn(el, 'month')).not.toBeNull();
    expect(el.querySelector('.record-total').textContent).toBe('You have finished 7 blocks in all.');
    rangeBtn(el, 'month').click();
    expect(weeks(el).length).toBeGreaterThan(0);
    expect(listed(el)).toHaveLength(5);
  });

  it('draws no ladder when it is handed no quests', () => {
    expect(renderRecordScreen(ctx()).querySelector('.quest-list')).toBeNull();
  });

  it('uses no guilt, deadline or failure wording, whatever the state', () => {
    for (const state of [{}, { lifetimeBlocks: 12 }, { lifetimeBlocks: 500, lairUnlocked: true }]) {
      const text = renderRecordScreen(qctx(state)).textContent;
      expect(text).not.toMatch(GUILT);
      expect(text).not.toMatch(DEADLINE);
    }
  });
});

describe('record screen: this week', () => {
  const world = { furniture, slots, dragons };
  const easy = { id: 'wk-a', title: 'Three blocks', kind: 'weekBlocks', goal: 3, reward: 6, tier: 'easy' };
  const medium = { id: 'wk-b', title: 'Study on three days', kind: 'weekDays', goal: 3, reward: 12, tier: 'medium' };
  const hard = { id: 'wk-c', title: 'Buy two treats', kind: 'weekFoods', goal: 2, reward: 18, tier: 'hard' };
  // now is Friday 2026-10-02; Monday of that week is 2026-09-28.
  const history = { '2026-09-28': { blocks: 2, minutes: 30 }, '2026-10-02': { blocks: 2, minutes: 30 } };
  const wctx = (over = {}) => ctx({}, {
    state: { coins: 12, history, lifetimeBlocks: 4, weekly: { week: weekKey(now), ids: ['wk-a', 'wk-b', 'wk-c'], paid: [], foods: 1, items: 0 } },
    quests, world, weekly: [easy, medium, hard], ...over,
  });
  const wentry = (el, id) => el.querySelector(`.weekly-list [data-quest="${id}"]`);

  it('shows this week\'s three quests above the ladder, with their progress', () => {
    const el = renderRecordScreen(wctx());
    const ids = [...el.querySelectorAll('.weekly-list [data-quest]')].map((e) => e.dataset.quest);
    expect(ids).toEqual(['wk-a', 'wk-b', 'wk-c']);
    expect(el.querySelector('.weekly-heading').textContent).toBe('This week');
    const order = [...el.children];
    expect(order.indexOf(el.querySelector('.weekly-list'))).toBeLessThan(order.indexOf(el.querySelector('.quest-list')));
    expect(wentry(el, 'wk-a').dataset.state).toBe('done');
    expect(wentry(el, 'wk-a').querySelector('.quest-mark').textContent).toMatch(/done/i);
    expect(wentry(el, 'wk-b').querySelector('.quest-progress').textContent).toBe('2 / 3');
    expect(wentry(el, 'wk-c').querySelector('.quest-progress').textContent).toBe('1 / 2');
    expect(wentry(el, 'wk-c').querySelector('.quest-reward').textContent).toContain('18');
  });

  it('puts this week first, above the chart', () => {
    const el = renderRecordScreen(wctx());
    const order = [...el.children];
    expect(order.indexOf(el.querySelector('.weekly-list'))).toBeLessThan(order.indexOf(el.querySelector('.record-week')));
  });

  it('says new quests arrive on Monday, with no deadline or blame words', () => {
    const el = renderRecordScreen(wctx());
    expect(el.querySelector('.weekly-note').textContent).toBe('New quests arrive every Monday.');
    const text = el.textContent;
    expect(text).not.toMatch(/hungry|lost|missed|neglect|streak|warning|failed|expired|deadline|hurry/i);
  });

  it('draws no weekly section when there are no weekly quests', () => {
    const el = renderRecordScreen(wctx({ weekly: [] }));
    expect(el.querySelector('.weekly-list')).toBeNull();
    expect(el.querySelector('.weekly-heading')).toBeNull();
  });
});

describe('record chart for screen readers', () => {
  it('gives each labelled bar the role that makes its label read', () => {
    const el = renderRecordScreen(ctx());
    for (const col of el.querySelectorAll('.record-day')) expect(col.getAttribute('role')).toBe('img');
  });
});
