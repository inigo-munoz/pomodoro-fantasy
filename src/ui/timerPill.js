// A small floating pill with the running clock, shown on every screen but the timer while a
// block or break runs. One tap goes back to the timer. Updated in place on each tick, so it
// never flickers; removed when the timer is shown or stops.
const mmss = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const showTimerPill = ({ label, remaining, onTap }) => {
  let pill = document.querySelector('.timer-pill');
  if (!pill) {
    pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'timer-pill';
    pill.innerHTML = '<span class="timer-pill-label"></span><span class="timer-pill-time"></span>';
    document.body.appendChild(pill);
  }
  pill.onclick = onTap;
  pill.querySelector('.timer-pill-label').textContent = label;
  pill.querySelector('.timer-pill-time').textContent = mmss(remaining);
  pill.setAttribute('aria-label', `${label} ${mmss(remaining)}`);
};

export const hideTimerPill = () => document.querySelector('.timer-pill')?.remove();
