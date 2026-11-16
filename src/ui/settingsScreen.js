import { english, languageNames } from '../i18n/i18n.js';
import { backButton } from './backButton.js';
import { screenTitle } from './screenTitle.js';
import { renderBackupPanel } from './backupPanel.js';

const clamp = (n, { min, max }) => Math.min(max, Math.max(min, n));

// How long the "Saved" note stays up. Long enough to be seen, short enough to not nag.
const SAVED_NOTE_MS = 2000;

export const renderSettingsScreen = ({
  settings, config, onSave, onBack, onChangeDragon, onBackup, onRestore, t = english,
  // Android only: a promise of the exact-alarm status, and the way to the system setting,
  // which resolves to the status after it. The web passes neither.
  exactAlarms, onAllowExactAlarms,
}) => {
  const { durations } = config;
  const section = document.createElement('section');
  section.className = 'screen settings';

  // The screen edits a private draft and only hands it over on SAVE, so the child confirms
  // on purpose. `baseline` is what is currently saved; it moves forward on every SAVE.
  let baseline = { ...settings };
  let draft = { ...settings };
  const isDirty = () => Object.keys(draft).some((key) => draft[key] !== baseline[key]);

  // The only timer on the screen. It is cancelled whenever it is replaced or the draft
  // changes, so at most one is ever pending.
  let noteTimer = null;
  const note = document.createElement('p');
  note.className = 'saved-note';
  note.setAttribute('role', 'status');
  const clearNote = () => {
    clearTimeout(noteTimer);
    noteTimer = null;
    note.textContent = '';
  };

  const change = (next) => {
    draft = { ...draft, ...next };
    clearNote();
    paint();
  };

  const label = (text) => {
    const name = document.createElement('div');
    name.className = 'setting-label';
    name.textContent = text;
    return name;
  };

  // One row per setting: a label, a stepper (◀ value ▶), and quick presets where the range
  // is wide enough to want them. `prefix` names the data-* hooks.
  const numericRow = ({ text, key, prefix, unit, presets, bounds }) => {
    const row = document.createElement('div');
    row.className = 'setting-row';

    const arrow = (direction, glyph, delta) => {
      const btn = document.createElement('button');
      btn.className = 'arrow-btn';
      btn.dataset.step = `${prefix}-${direction}`;
      btn.textContent = glyph;
      btn.setAttribute('aria-label', t(direction === 'minus' ? 'settings.less' : 'settings.more', { setting: text }));
      btn.addEventListener('click', () => {
        const next = clamp(draft[key] + delta, bounds);
        if (next !== draft[key]) change({ [key]: next });
      });
      return btn;
    };
    const value = document.createElement('span');
    value.className = 'value';
    value.textContent = unit ? `${draft[key]} ${unit}` : String(draft[key]);
    const stepper = document.createElement('div');
    stepper.className = 'stepper';
    stepper.append(arrow('minus', '◀', -1), value, arrow('plus', '▶', 1));
    row.append(label(text), stepper);

    if (presets) {
      const presetRow = document.createElement('div');
      presetRow.className = 'preset-row';
      for (const p of presets) {
        const btn = document.createElement('button');
        btn.className = 'preset' + (draft[key] === p ? ' active' : '');
        btn.setAttribute('aria-pressed', String(draft[key] === p));
        // setAttribute, not dataset: the hook is spelled data-longBreak-preset.
        btn.setAttribute(`data-${prefix}-preset`, String(p));
        btn.textContent = String(p);
        btn.addEventListener('click', () => change({ [key]: p }));
        presetRow.appendChild(btn);
      }
      row.appendChild(presetRow);
    }
    return row;
  };

  // A choice between named soundtracks, not a number, so no steppers.
  const musicRow = () => {
    const row = document.createElement('div');
    row.className = 'setting-row';
    const presetRow = document.createElement('div');
    presetRow.className = 'preset-row';
    for (const style of config.musicStyles) {
      const btn = document.createElement('button');
      btn.className = 'preset' + (draft.musicStyle === style ? ' active' : '');
      btn.setAttribute('aria-pressed', String(draft.musicStyle === style));
      btn.dataset.musicPreset = style;
      btn.textContent = t(`settings.music.${style}`);
      btn.addEventListener('click', () => change({ musicStyle: style }));
      presetRow.appendChild(btn);
    }
    row.append(label(t('settings.music')), presetRow);
    return row;
  };

  // Two presets, like the music: each language is named in its own language, whatever the
  // screen speaks. It saves with the rest of the draft; the app then redraws in it.
  const languageRow = () => {
    const row = document.createElement('div');
    row.className = 'setting-row';
    const presetRow = document.createElement('div');
    presetRow.className = 'preset-row';
    for (const lang of config.languages ?? []) {
      const on = draft.language === lang;
      const btn = document.createElement('button');
      btn.className = 'preset' + (on ? ' active' : '');
      btn.dataset.language = lang;
      btn.lang = lang;
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = languageNames[lang] ?? lang;
      btn.addEventListener('click', () => change({ language: lang }));
      presetRow.appendChild(btn);
    }
    row.append(label(t('settings.language')), presetRow);
    return row;
  };

  const buildPanel = () => {
    const panel = document.createElement('div');
    panel.className = 'settings-panel';
    panel.append(
      numericRow({ text: t('settings.work'), key: 'workMinutes', prefix: 'work', unit: 'min',
        presets: durations.workPresets, bounds: durations.customRange }),
      numericRow({ text: t('settings.break'), key: 'breakMinutes', prefix: 'break', unit: 'min',
        presets: durations.breakPresets, bounds: durations.customRange }),
      numericRow({ text: t('settings.longBreak'), key: 'longBreakMinutes', prefix: 'longBreak', unit: 'min',
        presets: durations.longBreakPresets, bounds: durations.customRange }),
      // The range is small, so one tap per step is already instant: no presets.
      numericRow({ text: t('settings.sessions'), key: 'sessionsBeforeLongBreak', prefix: 'sessions',
        bounds: durations.sessionsRange }),
      musicRow(),
      languageRow(),
    );
    return panel;
  };

  const save = () => {
    if (!isDirty()) return;
    onSave({ ...draft });
    baseline = { ...draft };
    paint();
    note.textContent = t('settings.saved');
    noteTimer = setTimeout(clearNote, SAVED_NOTE_MS);
  };

  // RESET only moves the draft. Nothing is lost until SAVE, so the button cannot destroy
  // anything by itself.
  const reset = () => change({ ...durations.default, musicStyle: config.musicStyles[0] });

  const buildActions = () => {
    const actions = document.createElement('div');
    actions.className = 'settings-actions';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'big-btn secondary';
    resetBtn.dataset.action = 'reset-settings';
    resetBtn.textContent = t('settings.reset');
    resetBtn.addEventListener('click', reset);

    const saveBtn = document.createElement('button');
    const live = isDirty();
    saveBtn.className = 'big-btn' + (live ? '' : ' dimmed');
    saveBtn.dataset.action = 'save-settings';
    saveBtn.disabled = !live;
    saveBtn.textContent = t('settings.save');
    saveBtn.addEventListener('click', save);

    actions.append(resetBtn, saveBtn);
    return actions;
  };

  // Leaving with unsaved changes asks first; the card lives inside this screen so it
  // disappears with it. A clean draft leaves at once. `leave` is the exit to take, so Back
  // and Change Dragon share this one card.
  const askBeforeLeaving = (leave) => {
    if (!isDirty()) { leave(); return; }
    if (section.querySelector('.confirm-overlay')) return;

    const button = (className, action, text, onClick) => {
      const btn = document.createElement('button');
      btn.className = className;
      btn.dataset.action = action;
      btn.textContent = text;
      btn.addEventListener('click', onClick);
      return btn;
    };
    const title = document.createElement('p');
    title.className = 'unlock-title';
    title.textContent = t('settings.askSave');
    const card = document.createElement('div');
    card.className = 'unlock-card';
    card.append(
      title,
      button('big-btn', 'confirm-save', t('settings.save'), () => { onSave({ ...draft }); leave(); }),
      button('big-btn secondary', 'confirm-discard', t('settings.dontSave'), leave),
    );
    const overlay = document.createElement('div');
    overlay.className = 'level-up-overlay confirm-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', t('settings.askSave'));
    overlay.appendChild(card);
    section.appendChild(overlay);
  };

  const panelSlot = document.createElement('div');
  panelSlot.className = 'settings-body';
  const paint = () => panelSlot.replaceChildren(buildPanel(), buildActions(), note);

  const changeDragon = document.createElement('button');
  changeDragon.className = 'big-btn';
  changeDragon.dataset.action = 'change-dragon';
  changeDragon.textContent = t('settings.changeCreature');
  if (onChangeDragon) changeDragon.addEventListener('click', () => askBeforeLeaving(onChangeDragon));

  // The status comes from the system, so the screen is drawn at once without the row and the
  // row joins below Change Creature if the answer is "denied". It sits outside the draft, so
  // its arrival never touches unsaved changes, and it leaves once exact alarms are allowed.
  const exactRow = document.createElement('div');
  exactRow.className = 'exact-alarms-row';
  exactRow.hidden = true;
  const showExactRow = (status) => {
    if (status !== 'denied') { exactRow.replaceChildren(); exactRow.hidden = true; return; }
    if (!exactRow.hidden) return;
    const line = document.createElement('p');
    line.className = 'exact-alarms-line';
    line.textContent = t('settings.exactAlarms');
    const allow = document.createElement('button');
    allow.className = 'big-btn secondary';
    allow.dataset.action = 'allow-exact-alarms';
    allow.textContent = t('settings.allowExactAlarms');
    allow.addEventListener('click', () => {
      Promise.resolve(onAllowExactAlarms?.()).then((next) => { if (next) showExactRow(next); }, () => {});
    });
    exactRow.replaceChildren(line, allow);
    exactRow.hidden = false;
  };
  if (onAllowExactAlarms) Promise.resolve(exactAlarms).then(showExactRow, () => {});

  section.append(backButton(() => askBeforeLeaving(onBack), t), screenTitle(t('settings.title')), panelSlot, changeDragon, exactRow);
  if (onBackup && onRestore) section.appendChild(renderBackupPanel({ onBackup, onRestore, t }));
  paint();
  return section;
};
