import { describe, expect, it } from 'vitest';
import { parseTokens } from './generate-native-tokens.js';

describe('parseTokens', () => {
  it('extracts flat color/radius vars from :root', () => {
    const css = `:root { --bg: #FAFAF7; --r-sm: 6px; --shadow-xs: 0 1px 0 rgba(14,18,14,0.04); }`;
    expect(parseTokens(css)).toEqual({
      bg: '#FAFAF7',
      rSm: 6,
      shadowXs: '0 1px 0 rgba(14,18,14,0.04)',
    });
  });

  it('ignores declarations outside :root and keeps multi-part values as strings', () => {
    const css = `
      body { --not-a-token: red; }
      :root {
        --font-sans: 'Inter', -apple-system, system-ui, sans-serif;
        --r-pill: 999px;
      }
    `;
    expect(parseTokens(css)).toEqual({
      fontSans: "'Inter', -apple-system, system-ui, sans-serif",
      rPill: 999,
    });
  });
});
