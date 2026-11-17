import { vi, describe, it, expect } from 'vitest';
import { createNativeReminders, END_NOTICE_ID } from './nativeReminders.js';

// A stand-in for Capacitor's LocalNotifications: permission answers in its own words
// ('granted', 'denied', 'prompt', 'prompt-with-rationale'), and schedule/cancel are recorded.
const fakeNotifications = ({ display = 'prompt', answer = 'granted', exact = 'granted' } = {}) => {
  const plugin = {
    display,
    checkPermissions: vi.fn(async () => ({ display: plugin.display })),
    requestPermissions: vi.fn(async () => { plugin.display = answer; return { display: answer }; }),
    checkExactNotificationSetting: vi.fn(async () => ({ exact_alarm: exact })),
    schedule: vi.fn(async () => ({ notifications: [{ id: END_NOTICE_ID }] })),
    cancel: vi.fn(async () => {}),
  };
  return plugin;
};
const flush = () => new Promise((r) => setTimeout(r, 0));
const make = (plugin) => createNativeReminders(plugin, { wakeLock: null });

describe('native reminders: permission', () => {
  it.each([
    ['prompt', 'default'],
    ['prompt-with-rationale', 'default'],
    ['granted', 'granted'],
    ['denied', 'denied'],
  ])('reads the plugin state %s as %s', async (display, expected) => {
    const reminders = make(fakeNotifications({ display }));
    await flush();
    expect(reminders.permission).toBe(expected);
  });

  it('is undecided until the plugin has answered, so the first Start can still ask', () => {
    expect(make(fakeNotifications({ display: 'granted' })).permission).toBe('default');
  });

  it('asks the system once while undecided, and reports what stuck', async () => {
    const plugin = fakeNotifications({ display: 'prompt', answer: 'granted' });
    const reminders = make(plugin);
    await expect(reminders.request()).resolves.toBe('granted');
    await expect(reminders.request()).resolves.toBe('granted');
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1);
    expect(reminders.permission).toBe('granted');
  });

  it('never asks when the system has already decided', async () => {
    const plugin = fakeNotifications({ display: 'denied' });
    await expect(make(plugin).request()).resolves.toBe('denied');
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
  });

  it('survives a plugin that fails to check or to ask', async () => {
    const plugin = fakeNotifications();
    plugin.checkPermissions.mockRejectedValue(new Error('no'));
    plugin.requestPermissions.mockRejectedValue(new Error('no'));
    const reminders = make(plugin);
    await expect(reminders.request()).resolves.toBe('default');
  });
});

describe('native reminders: the end of a block', () => {
  const notice = { at: Date.UTC(2026, 10, 16, 10, 25), title: 'Block finished!', body: 'Nice work.' };

  it('schedules one notice with a fixed id for the moment the block ends', async () => {
    const plugin = fakeNotifications({ display: 'granted' });
    await make(plugin).scheduleEnd(notice);
    expect(plugin.schedule).toHaveBeenCalledTimes(1);
    const [n] = plugin.schedule.mock.calls[0][0].notifications;
    expect(n).toMatchObject({ id: END_NOTICE_ID, title: 'Block finished!', body: 'Nice work.' });
    expect(n.schedule.at).toEqual(new Date(notice.at));
    expect(n.schedule.allowWhileIdle).toBe(true);
    expect(n.isExactNotification).toBe(true);
  });

  // Without the exact-alarm setting the plugin would open the system settings on every Start;
  // an inexact notice a little late is far better than that in front of a child.
  it('asks for an inexact alarm when exact alarms are not allowed', async () => {
    const plugin = fakeNotifications({ display: 'granted', exact: 'denied' });
    await make(plugin).scheduleEnd(notice);
    expect(plugin.schedule.mock.calls[0][0].notifications[0].isExactNotification).toBe(false);
  });

  it('replaces the previous notice rather than stacking a second one', async () => {
    const plugin = fakeNotifications({ display: 'granted' });
    const reminders = make(plugin);
    await reminders.scheduleEnd(notice);
    await reminders.scheduleEnd({ ...notice, at: notice.at + 60_000 });
    const ids = plugin.schedule.mock.calls.map((c) => c[0].notifications[0].id);
    expect(ids).toEqual([END_NOTICE_ID, END_NOTICE_ID]);
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: [{ id: END_NOTICE_ID }] });
  });

  it('waits for a permission prompt in flight before scheduling (Android refuses it until then)', async () => {
    const plugin = fakeNotifications({ display: 'prompt' });
    let answer;
    plugin.requestPermissions.mockImplementation(() => new Promise((r) => { answer = r; }));
    const reminders = make(plugin);
    await flush();
    reminders.request();
    const scheduled = reminders.scheduleEnd(notice);
    await flush();
    expect(plugin.schedule).not.toHaveBeenCalled();
    answer({ display: 'granted' });
    await scheduled;
    expect(plugin.schedule).toHaveBeenCalledTimes(1);
  });

  it('cancels the scheduled notice by its id, after any schedule still on its way', async () => {
    const plugin = fakeNotifications({ display: 'granted' });
    const reminders = make(plugin);
    reminders.scheduleEnd(notice);
    await reminders.cancelScheduled();
    expect(plugin.schedule).toHaveBeenCalledTimes(1);
    expect(plugin.cancel.mock.calls.at(-1)[0]).toEqual({ notifications: [{ id: END_NOTICE_ID }] });
    expect(plugin.cancel.mock.invocationCallOrder.at(-1))
      .toBeGreaterThan(plugin.schedule.mock.invocationCallOrder[0]);
  });

  it('does not notify at the end on its own: the scheduled notice is the only one', async () => {
    const plugin = fakeNotifications({ display: 'granted' });
    await make(plugin).notify({ title: 't', body: 'b' });
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it('never throws or rejects when the plugin fails', async () => {
    const plugin = fakeNotifications({ display: 'granted' });
    plugin.checkExactNotificationSetting.mockRejectedValue(new Error('no'));
    plugin.schedule.mockRejectedValue(new Error('disabled'));
    plugin.cancel.mockRejectedValue(new Error('no'));
    const reminders = make(plugin);
    await expect(reminders.scheduleEnd(notice)).resolves.toBeUndefined();
    await expect(reminders.cancelScheduled()).resolves.toBeUndefined();
    // A failed cancel before scheduling does not stop the schedule.
    expect(plugin.schedule).toHaveBeenCalled();
  });
});

describe('native reminders: keeping the screen awake', () => {
  it('uses the Wake Lock API when the WebView has it', async () => {
    const release = vi.fn(async () => {});
    const wakeLock = { request: vi.fn(async () => ({ release })) };
    const reminders = createNativeReminders(fakeNotifications(), { wakeLock });
    await reminders.keepAwake();
    await reminders.release();
    expect(wakeLock.request).toHaveBeenCalledWith('screen');
    expect(release).toHaveBeenCalled();
  });

  it('degrades to nothing without it', async () => {
    const reminders = make(fakeNotifications());
    await expect(reminders.keepAwake()).resolves.toBeUndefined();
    await expect(reminders.release()).resolves.toBeUndefined();
  });
});

// Android 14+ denies exact alarms to new installs, so a notice can ring minutes after the
// block ends. The app asks once, through the system "Alarms & reminders" setting.
describe('native reminders: exact alarms', () => {
  it.each([
    ['granted', 'granted'],
    ['denied', 'denied'],
    ['prompt', 'denied'],
  ])('reads the exact-alarm setting %s as %s', async (exact, expected) => {
    await expect(make(fakeNotifications({ exact })).exactAlarms()).resolves.toBe(expected);
  });

  it('is unsupported when the plugin cannot say', async () => {
    const plugin = fakeNotifications();
    plugin.checkExactNotificationSetting.mockRejectedValue(new Error('no'));
    await expect(make(plugin).exactAlarms()).resolves.toBe('unsupported');
    plugin.checkExactNotificationSetting.mockResolvedValue(undefined);
    await expect(make(plugin).exactAlarms()).resolves.toBe('unsupported');
  });

  it('opens the system setting when asked, and never throws', async () => {
    const plugin = fakeNotifications({ exact: 'denied' });
    plugin.changeExactNotificationSetting = vi.fn(async () => ({ exact_alarm: 'granted' }));
    await expect(make(plugin).requestExactAlarms()).resolves.toBeUndefined();
    expect(plugin.changeExactNotificationSetting).toHaveBeenCalledTimes(1);
    plugin.changeExactNotificationSetting.mockRejectedValue(new Error('no'));
    await expect(make(plugin).requestExactAlarms()).resolves.toBeUndefined();
  });
});
