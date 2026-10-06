const liveRemaining = (state, now) =>
  Math.max(0, Math.ceil((state.endsAt - now) / 1000));

export const createTimerState = (settings) => ({
  mode: 'work',
  running: false,
  remaining: settings.workMinutes * 60,
  endsAt: null,
  workSeconds: settings.workMinutes * 60,
  breakSeconds: settings.breakMinutes * 60,
  longBreakSeconds: settings.longBreakMinutes * 60,
  sessionsBeforeLongBreak: settings.sessionsBeforeLongBreak,
  completedWork: 0,
  roundComplete: false,
});

export const isBreak = (mode) => mode === 'break' || mode === 'longBreak';

export const secondsForMode = (state, mode) => {
  if (mode === 'work') return state.workSeconds;
  if (mode === 'longBreak') return state.longBreakSeconds;
  return state.breakSeconds;
};

// Starting is what dismisses a finished round: the child has seen it and is beginning the next.
export const start = (state, now) => {
  if (state.running) return state;
  return { ...state, running: true, endsAt: now + state.remaining * 1000, roundComplete: false };
};

export const pause = (state, now) => {
  if (!state.running) return state;
  return { ...state, running: false, remaining: liveRemaining(state, now), endsAt: null };
};

export const tick = (state, now) => {
  if (!state.running) {
    return { state, completed: false };
  }
  const remaining = liveRemaining(state, now);
  if (remaining > 0) {
    return { state: { ...state, remaining }, completed: false };
  }
  return {
    state: { ...state, remaining: 0, running: false, endsAt: null },
    completed: true,
  };
};

// The one place the next phase is chosen. The work counter only ever grows; the modulo
// turns it into a cycle (long breaks after 4, 8, 12...). A missing or non-positive cycle
// length means "never a long break" rather than a division by zero.
// The end of a long break is the end of a round. The flag lets the screen say so instead of
// quietly dropping back to session 1, which looked like the cycle never ends.
export const advance = (state) => {
  let { completedWork = 0 } = state;
  let nextMode = 'work';
  if (state.mode === 'work') {
    completedWork += 1;
    const cycle = state.sessionsBeforeLongBreak;
    const longDue = cycle > 0 && completedWork % cycle === 0;
    nextMode = longDue ? 'longBreak' : 'break';
  }
  return {
    ...state,
    mode: nextMode,
    completedWork,
    roundComplete: state.mode === 'longBreak',
    remaining: secondsForMode(state, nextMode),
    running: false,
    endsAt: null,
  };
};
