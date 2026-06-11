import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type TokenValue = string | number;

/** Extract `--name: value;` pairs from the `:root` block of a tokens CSS file.
    Names are camelCased; bare `<N>px` values become numbers (RN density-independent units). */
export function parseTokens(css: string): Record<string, TokenValue> {
  const rootMatch = /:root\s*\{([\s\S]*?)\}/.exec(css);
  if (!rootMatch?.[1]) throw new Error('No :root block found in tokens CSS');

  const tokens: Record<string, TokenValue> = {};
  const declaration = /--([\w-]+)\s*:\s*([^;]+);/g;
  for (const match of rootMatch[1].matchAll(declaration)) {
    const [, rawName, rawValue] = match;
    if (rawName === undefined || rawValue === undefined) continue;
    const name = rawName.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
    const value = rawValue.trim();
    const px = /^(\d+(?:\.\d+)?)px$/.exec(value);
    tokens[name] = px?.[1] !== undefined ? Number(px[1]) : value;
  }
  return tokens;
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const css = readFileSync(join(here, '../src/styles/tokens.css'), 'utf8');
  const tokens = parseTokens(css);
  const entries = Object.entries(tokens)
    .map(([key, value]) => `  ${key}: ${typeof value === 'number' ? String(value) : JSON.stringify(value)},`)
    .join('\n');
  const out = `// GENERATED — run \`pnpm generate:tokens\` after editing src/styles/tokens.css. Do not edit by hand.
export const tokens = {
${entries}
} as const;

export type Tokens = typeof tokens;
`;
  const outDir = join(here, '../src/tokens');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'native.ts'), out);
  process.stdout.write(`Wrote ${String(Object.keys(tokens).length)} tokens to src/tokens/native.ts\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
