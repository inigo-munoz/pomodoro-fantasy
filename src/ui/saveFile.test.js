import { describe, it, expect, vi, afterEach } from 'vitest';
import { saveFile } from './saveFile.js';

afterEach(() => {
  delete navigator.canShare;
  delete navigator.share;
  vi.restoreAllMocks();
});

describe('saveFile', () => {
  it('opens the share sheet with the file where the device can share files', async () => {
    navigator.canShare = vi.fn(() => true);
    navigator.share = vi.fn(async () => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    await saveFile('b.json', '{"a":1}');
    const [{ files }] = navigator.share.mock.calls[0];
    expect(files[0].name).toBe('b.json');
    expect(click).not.toHaveBeenCalled();
  });

  it('downloads the file under its name where it cannot share', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const links = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { links.push(this); });
    await saveFile('b.json', '{"a":1}');
    expect(links).toHaveLength(1);
    expect(links[0].download).toBe('b.json');
    expect(links[0].href).toBe('blob:x');
  });

  it('treats a cancelled share as done, without downloading', async () => {
    navigator.canShare = vi.fn(() => true);
    navigator.share = vi.fn(async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    await saveFile('b.json', '{}');
    expect(click).not.toHaveBeenCalled();
  });
});

describe('saveFile outcome', () => {
  it('reports what happened, so the screen can confirm it', async () => {
    navigator.canShare = vi.fn(() => true);
    navigator.share = vi.fn(async () => {});
    expect(await saveFile('b.json', '{}')).toBe('shared');
    navigator.share = vi.fn(async () => { throw Object.assign(new Error('x'), { name: 'AbortError' }); });
    expect(await saveFile('b.json', '{}')).toBe('cancelled');
    delete navigator.canShare;
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    expect(await saveFile('b.json', '{}')).toBe('downloaded');
  });
});
