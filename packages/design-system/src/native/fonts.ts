// Native fontFamily takes a single family name (no CSS fallback stacks).
// Apps must load these families (expo-font) before rendering primitives.
export const fonts = {
  display: 'Newsreader',
  sans: 'Inter',
  mono: 'JetBrains Mono',
} as const;

export type Fonts = typeof fonts;
