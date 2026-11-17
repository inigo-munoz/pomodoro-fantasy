// Asked once, after the first Start, in the Android app when exact alarms are not allowed:
// without them the end-of-block notice can ring minutes after the block ends. It sits over
// the page (the timer keeps running underneath) on document.body, like the other confirm dialogs, so
// a redraw of the timer cannot take it away. Either button closes it; the caller remembers
// that the question was asked.
export const showExactAlarmsPrompt = ({ t, onOpenSettings, onNotNow }) => {
  const overlay = document.createElement('div');
  const close = () => overlay.remove();
  const button = (className, action, text, onClick) => {
    const btn = document.createElement('button');
    btn.className = className;
    btn.dataset.action = action;
    btn.textContent = text;
    btn.addEventListener('click', () => { close(); onClick(); });
    return btn;
  };

  const heading = document.createElement('p');
  heading.className = 'unlock-title';
  heading.textContent = t('exactAlarms.title');
  const body = document.createElement('p');
  body.textContent = t('exactAlarms.body');
  const card = document.createElement('div');
  card.className = 'unlock-card';
  card.append(
    heading, body,
    button('big-btn', 'exact-alarms-open', t('exactAlarms.open'), onOpenSettings),
    button('big-btn secondary', 'exact-alarms-later', t('exactAlarms.notNow'), onNotNow),
  );

  overlay.className = 'level-up-overlay confirm-overlay exact-alarms-prompt';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('exactAlarms.title'));
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  return overlay;
};
