// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { CONTENT_SECURITY_POLICY, cspPlugin } from './csp.js';

const directives = Object.fromEntries(
  CONTENT_SECURITY_POLICY.split(';').map((d) => d.trim()).filter(Boolean)
    .map((d) => { const [name, ...values] = d.split(/\s+/); return [name, values]; }),
);

describe('content security policy', () => {
  it('lets only the app itself run code and load things', () => {
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['script-src']).toEqual(["'self'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['base-uri']).toEqual(["'self'"]);
  });

  it('never allows inline or evaluated code', () => {
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/unsafe-inline|unsafe-eval/);
  });

  it('is added to the built page only, with a no-referrer policy', () => {
    const plugin = cspPlugin();
    expect(plugin.apply).toBe('build');
    const html = plugin.transformIndexHtml('<head><meta charset="UTF-8" /></head>');
    expect(html).toContain(`<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`);
    expect(html).toContain('<meta name="referrer" content="no-referrer">');
  });
});
