import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const page = readFileSync('public/privacy.html', 'utf8');

// Google Play asks for a privacy policy URL even when nothing is collected.
describe('privacy policy page', () => {
  it('is there in English and in Spanish', () => {
    expect(page).toContain('id="en"');
    expect(page).toContain('id="es" lang="es"');
    expect(page).toContain('Privacy policy');
    expect(page).toContain('Política de privacidad');
  });

  it('loads nothing from anywhere: no scripts, no external styles or fonts', () => {
    expect(page).not.toMatch(/<script|<link|@import|https?:\/\/(?!github\.com\/inigo-munoz)/);
  });
});
