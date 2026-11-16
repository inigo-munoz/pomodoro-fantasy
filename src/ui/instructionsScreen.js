import { english } from '../i18n/i18n.js';
import { config } from '../data/config.js';
import { backButton } from './backButton.js';
import { screenTitle } from './screenTitle.js';

// Short and plain, for a child reading with an adult. The block, break and cycle lengths are
// the child's own settings, so they are read from `settings` (the saved shape); only the lair
// price and the coin rate are fixed rules and come from config. Nothing here may scold: the
// tests forbid it, and quests are described without a target or a deadline. The words live in
// the dictionaries (`instructions.*`), with each number's unit picked by its plural rules.
const defaultSettings = () => ({ ...config.durations.default, musicStyle: config.musicStyles[0] });

const STEPS = ['choose', 'cycle', 'long', 'earn', 'feed', 'lair', 'quests', 'record', 'backup'];

const steps = (settings, t) => {
  const minutes = (count) => t('instructions.minutes', { count });
  const params = {
    work: minutes(settings.workMinutes),
    break: minutes(settings.breakMinutes),
    long: minutes(settings.longBreakMinutes),
    blocks: t('instructions.workBlocks', { count: settings.sessionsBeforeLongBreak }),
    minutes: minutes(config.minutesPerCoin),
    coins: t('instructions.coins', { count: config.lairUnlockPrice }),
  };
  return STEPS.map((id) => [t(`instructions.${id}.heading`), t(`instructions.${id}.body`, params)]);
};

export const renderInstructionsScreen = ({ onBack, settings = defaultSettings(), t = english }) => {
  const section = document.createElement('section');
  section.className = 'screen instructions';

  const bar = document.createElement('div');
  bar.className = 'screen-bar';
  bar.appendChild(backButton(onBack, t));
  section.appendChild(bar);
  section.appendChild(screenTitle(t('instructions.title')));

  const list = document.createElement('ol');
  list.className = 'instruction-list';
  for (const [heading, body] of steps(settings, t)) {
    const item = document.createElement('li');
    item.className = 'instruction-step';
    const h = document.createElement('h2');
    h.textContent = heading;
    const p = document.createElement('p');
    p.textContent = body;
    item.append(h, p);
    list.appendChild(item);
  }
  section.appendChild(list);
  return section;
};
