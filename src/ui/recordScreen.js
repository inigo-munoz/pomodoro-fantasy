import { english, weekdayNames } from '../i18n/i18n.js';
import { weekOf, monthOf } from '../core/history.js';
import { questProgress } from '../core/quests.js';
import { weeklyProgress } from '../core/weekly.js';
import { backButton } from './backButton.js';
import { coinCounter } from './coinCounter.js';
import { screenTitle } from './screenTitle.js';
import { themedIcon, localizeIcons } from './themedIcon.js';

// Day names follow the language chosen in Settings, never the device locale (weekdayNames
// pins them to a Monday-first week); in that week the position already names the day.

// A bar and its number, shared by both ranges. Only what she did is drawn: a span that has
// happened shows its count, and a count of 0 is printed as a plain 0, a fact and nothing
// more. A span still to come is quieter again and has no text whatsoever, so it can never
// read as something she did not do. Bars are scaled to the best bar on screen, so the
// tallest one fills its track and the others are read against it, never against a target.
const barParts = (entry, best) => {
  const count = document.createElement('span');
  count.className = 'record-count';
  // A span still to come is blank, with one exception: if it somehow holds work, that work is
  // shown. A tablet whose clock ran fast records real blocks on a date that becomes the future
  // once the clock is corrected, and a blank bar would read as if she had never done them.
  count.textContent = entry.isFuture && entry.blocks === 0 ? '' : String(entry.blocks);

  const track = document.createElement('div');
  track.className = 'record-track';
  const bar = document.createElement('div');
  bar.className = 'record-bar';
  bar.style.height = `${best > 0 ? (entry.blocks / best) * 100 : 0}%`;
  track.appendChild(bar);
  return { count, track };
};

const nameLabel = (text) => {
  const label = document.createElement('span');
  label.className = 'record-day-name';
  label.textContent = text;
  return label;
};

// One column per day: the week view.
const dayColumn = (day, name, best, t) => {
  const col = document.createElement('div');
  col.className = 'record-day' + (day.isToday ? ' is-today' : '') + (day.isFuture ? ' is-future' : '');
  col.dataset.day = day.key;
  if (day.isToday) col.setAttribute('aria-current', 'date');
  col.setAttribute('aria-label', day.isFuture ? name : `${name}, ${t('record.blocks', { count: day.blocks })}`);

  const { count, track } = barParts(day, best);
  col.append(count, track, nameLabel(day.isFuture ? '' : name));
  return col;
};

// One column per calendar week: the month view. It is `.record-span`, not `.record-day`,
// because it is a span of days, and the week view's selectors stay exactly as they were.
// The label is the in-month days it covers, and its count is the blocks of those days only.
const weekColumn = (week, best, t) => {
  const col = document.createElement('div');
  col.className = 'record-span' + (week.isCurrent ? ' is-current' : '') + (week.isFuture ? ' is-future' : '');
  col.dataset.week = week.key;
  if (week.isCurrent) col.setAttribute('aria-current', 'date');
  const name = t('record.days', { label: week.label });
  col.setAttribute('aria-label', week.isFuture ? name : `${name}, ${t('record.blocks', { count: week.blocks })}`);

  const { count, track } = barParts(week, best);
  col.append(count, track, nameLabel(week.isFuture ? '' : week.label));
  return col;
};

// One rung of the ladder. A quest is either done or in progress, and nothing else: there is
// no third state to draw, so an unfinished one can only show how far it has come. A done
// quest stays on the list with a mark, because the ladder is the point. Whether it was paid
// is not shown: that is bookkeeping, and the state alone says what she has done.
const questEntry = (quest, { current, goal, done }, theme, t) => {
  const item = document.createElement('li');
  item.className = 'quest food-card';
  item.dataset.quest = quest.id;
  item.dataset.state = done ? 'done' : 'doing';

  const title = document.createElement('span');
  title.className = 'quest-title';
  title.textContent = quest.title;

  const progress = document.createElement('span');
  progress.className = 'quest-progress';
  progress.textContent = `${current} / ${goal}`;

  const reward = document.createElement('span');
  reward.className = 'quest-reward';
  const coin = document.createElement('span');
  coin.className = 'price-coin';
  coin.appendChild(themedIcon(theme, 'coin'));
  reward.append(coin, ` ${quest.reward}`);

  item.append(title, progress, reward);
  if (done) {
    const mark = document.createElement('span');
    mark.className = 'quest-mark';
    mark.textContent = t('record.done');
    item.appendChild(mark);
  }
  return item;
};

const questList = (className, label, entries, theme, t) => {
  const list = document.createElement('ul');
  list.className = className;
  list.setAttribute('aria-label', label);
  list.append(...entries.map(([quest, progress]) => questEntry(quest, progress, theme, t)));
  return list;
};

const NEXT_RUNGS = 5;

// The permanent ladder runs to dozens of rungs, so the screen shows what comes next. Each of
// the four themes (blocks, lair, creatures, families) gets its first unfinished rung, so the
// long blocks ladder cannot fill every place while the lair and the creatures wait; any place
// left goes to the next unfinished rungs in catalogue order. Shown in catalogue order.
const themeOf = (q) => {
  if (q.family || q.kind === 'everyFamily') return 'families';
  if (q.kind === 'blocks') return 'blocks';
  if (['growing', 'fullGrown', 'reached'].includes(q.kind)) return 'creatures';
  return 'lair';
};

const nextRungs = (quests, state, world) => {
  const open = quests
    .map((quest) => [quest, questProgress(quest, state, world)])
    .filter(([, progress]) => !progress.done);
  const chosen = new Set();
  const themes = new Set();
  for (const entry of open) {
    if (themes.has(themeOf(entry[0]))) continue;
    themes.add(themeOf(entry[0]));
    chosen.add(entry);
  }
  for (const entry of open) {
    if (chosen.size >= NEXT_RUNGS) break;
    chosen.add(entry);
  }
  return open.filter((entry) => chosen.has(entry)).slice(0, NEXT_RUNGS);
};

const heading = (className, text) => {
  const h = document.createElement('h2');
  h.className = `quest-heading ${className}`;
  h.textContent = text;
  return h;
};

const RANGES = [
  { id: 'week', text: 'record.week' },
  { id: 'month', text: 'record.month' },
];

// `quests` and `world` come from the caller, like the shop's foods: this screen imports no
// data. With no quests handed in, there is simply no ladder.
export const renderRecordScreen = ({
  state, now, theme, onBack, quests = [], world = {}, weekly = [], t = english,
}) => {
  const dayNames = weekdayNames(t.lang);
  const section = document.createElement('section');
  section.className = 'screen record';

  const bar = document.createElement('div');
  bar.className = 'screen-bar';
  bar.append(backButton(onBack, t), coinCounter(state.coins, theme));
  section.appendChild(bar);
  section.appendChild(screenTitle(t('record.title')));

  // This week's three come first, above the chart: they are the ones that change, and the
  // ones a child comes here to check. When the week turns they are
  // simply replaced, so nothing here counts down or marks what was left unfinished.
  if (weekly.length > 0) {
    const entries = weekly.map((q) => [q, weeklyProgress(q, state, now)]);
    const note = document.createElement('p');
    note.className = 'weekly-note';
    note.textContent = t('record.weeklyNote');
    section.append(heading('weekly-heading', t('record.thisWeek')),
      questList('weekly-list', t('record.thisWeek'), entries, theme, t), note);
  }


  const history = state.history ?? {};
  const chart = document.createElement('div');
  chart.className = 'record-week';

  // The range lives only in this render: the screen opens on the week every time.
  const buttons = RANGES.map(({ id, text }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset';
    btn.dataset.range = id;
    btn.textContent = t(text);
    btn.addEventListener('click', () => draw(id));
    return btn;
  });
  const switcher = document.createElement('div');
  switcher.className = 'preset-row record-range';
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', t('record.range'));
  switcher.append(...buttons);

  const draw = (range) => {
    const entries = range === 'month' ? monthOf(history, now) : weekOf(history, now);
    const best = Math.max(...entries.map((e) => e.blocks));
    chart.replaceChildren(...entries.map((e, i) => (
      range === 'month' ? weekColumn(e, best, t) : dayColumn(e, dayNames[i], best, t)
    )));
    buttons.forEach((btn) => {
      const on = btn.dataset.range === range;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  };
  draw('week');
  section.append(switcher, chart);

  const total = document.createElement('p');
  total.className = 'record-total';
  total.textContent = t('record.total', { count: state.lifetimeBlocks ?? 0 });
  section.appendChild(total);

  if (quests.length > 0) {
    const done = quests.filter((q) => questProgress(q, state, world).done).length;
    const summary = document.createElement('p');
    summary.className = 'quest-summary';
    summary.textContent = t('record.questSummary', { done, total: quests.length });
    section.append(heading('', t('record.quests')), summary,
      questList('quest-list ladder-list', t('record.quests'), nextRungs(quests, state, world), theme, t));
  }

  return localizeIcons(section, t);
};
