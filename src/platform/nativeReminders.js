import { createReminders } from './reminders.js';

// Reminders for the Android app. The WebView has no Notification API, and Android may freeze
// a backgrounded WebView, so the end of a block is scheduled with the system through
// Capacitor's LocalNotifications when the block starts, and cancelled when it will not end
// then. `notify` does nothing: the scheduled notice is the one she gets, never a second.
// Like the web reminders, nothing here ever throws or rejects: a missed notice must not
// break the timer.

// One notice at a time, so one fixed id: scheduling again replaces it, cancelling needs no lookup.
export const END_NOTICE_ID = 1;

// The plugin speaks Capacitor's permission words; the app speaks the browser's.
const fromPlugin = (display) => {
  if (display === 'granted' || display === 'denied') return display;
  if (display === 'prompt' || display === 'prompt-with-rationale') return 'default';
  return 'unsupported';
};

export const createNativeReminders = (notifications, { wakeLock } = {}) => {
  // Keeping the screen awake is the Wake Lock API, if the WebView has it; otherwise nothing.
  const screen = createReminders({ notification: null, serviceWorker: null, wakeLock });
  const ref = [{ id: END_NOTICE_ID }];

  // Undecided until the plugin answers, so the first Start can still ask.
  let permission = 'default';
  const checked = (async () => {
    try { permission = fromPlugin((await notifications.checkPermissions())?.display); } catch { /* keep undecided */ }
  })();
  let asked = false;
  let asking = Promise.resolve();

  // Schedules and cancels run one after another, so a cancel can never land before the
  // schedule it is meant to take back.
  let queue = Promise.resolve();
  const enqueue = (task) => {
    queue = queue.then(task).catch(() => { /* a missed notice, nothing more */ });
    return queue;
  };

  return {
    get permission() { return permission; },

    async request() {
      await checked;
      if (asked || permission !== 'default') return permission;
      asked = true;
      asking = (async () => {
        try { permission = fromPlugin((await notifications.requestPermissions())?.display); } catch { /* dismissed or failed */ }
      })();
      await asking;
      return permission;
    },

    async notify() {},

    scheduleEnd: ({ at, title, body }) => enqueue(async () => {
      // Android refuses to schedule while notifications are not allowed, so a prompt still
      // open (the first Start) is answered first.
      await asking;
      // Asking for an exact alarm without the system setting makes the plugin open the
      // settings screen on every Start; a notice a little late is better than that.
      let exact = false;
      try {
        exact = (await notifications.checkExactNotificationSetting())?.exact_alarm === 'granted';
      } catch { /* unknown: inexact */ }
      try { await notifications.cancel({ notifications: ref }); } catch { /* nothing to replace */ }
      await notifications.schedule({
        notifications: [{
          id: END_NOTICE_ID, title, body,
          schedule: { at: new Date(at), allowWhileIdle: true },
          isExactNotification: exact,
        }],
      });
    }).then(() => {}),

    cancelScheduled: () => enqueue(() => notifications.cancel({ notifications: ref })).then(() => {}),

    // Android 14+ denies exact alarms to new installs, and an inexact notice can ring many
    // minutes after the block ends. These read and open the system "Alarms & reminders"
    // setting; like everything here they never reject.
    async exactAlarms() {
      try {
        const state = (await notifications.checkExactNotificationSetting())?.exact_alarm;
        if (state === 'granted') return 'granted';
        if (typeof state === 'string') return 'denied';
      } catch { /* the plugin cannot say */ }
      return 'unsupported';
    },

    async requestExactAlarms() {
      try { await notifications.changeExactNotificationSetting(); } catch { /* the screen did not open */ }
    },

    keepAwake: () => screen.keepAwake(),
    release: () => screen.release(),
  };
};

// Loads the plugin only when called, so the web build never bundles it.
export const loadNativeReminders = async () => {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return () => createNativeReminders(LocalNotifications);
};
