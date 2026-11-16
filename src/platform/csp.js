// The page may only run and load what the app itself ships. A restored backup is a file anyone
// can edit; if a value from it ever reached the page as markup again, this policy stops any
// script in it from running. No inline code or styles are allowed: styles come from the
// stylesheet and are set from JavaScript (el.style), which the policy permits.
// blob: covers the backup file being handed to a download link.
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

// Only for the built app: the dev server injects styles and a live-reload client inline, which
// this policy would rightly block.
export const cspPlugin = () => ({
  name: 'pomodoro-csp',
  apply: 'build',
  transformIndexHtml: (html) => html.replace(
    /<meta charset="UTF-8" \/>/,
    (charset) => `${charset}\n    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`
      + '\n    <meta name="referrer" content="no-referrer">',
  ),
});
