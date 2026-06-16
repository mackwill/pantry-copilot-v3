import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type TokenValue = string | number;

function camelCase(name: string): string {
  return name.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
}

/** Parse `--name: value;` declarations from a CSS block into camelCased tokens.
    Bare `<N>px` values become numbers (RN density-independent units). */
function parseDeclarations(block: string): Record<string, TokenValue> {
  const tokens: Record<string, TokenValue> = {};
  const declaration = /--([\w-]+)\s*:\s*([^;]+);/g;
  for (const match of block.matchAll(declaration)) {
    const [, rawName, rawValue] = match;
    if (rawName === undefined || rawValue === undefined) continue;
    const value = rawValue.trim();
    const px = /^(\d+(?:\.\d+)?)px$/.exec(value);
    tokens[camelCase(rawName)] = px?.[1] !== undefined ? Number(px[1]) : value;
  }
  return tokens;
}

/** Extract the `:root` token block from a tokens CSS file. */
export function parseTokens(css: string): Record<string, TokenValue> {
  const rootMatch = /:root\s*\{([\s\S]*?)\}/.exec(css);
  if (!rootMatch?.[1]) throw new Error('No :root block found in tokens CSS');
  return parseDeclarations(rootMatch[1]);
}

/** Extract a scoped override block (e.g. `.theme-stove`) as a token group. */
export function parseScope(css: string, selector: string): Record<string, TokenValue> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`).exec(css);
  if (!match?.[1]) throw new Error(`No ${selector} block found in tokens CSS`);
  return parseDeclarations(match[1]);
}

function serializeValue(value: TokenValue): string {
  return typeof value === 'number' ? String(value) : JSON.stringify(value);
}

function serializeGroup(tokens: Record<string, TokenValue>, indent: string): string {
  return Object.entries(tokens)
    .map(([key, value]) => `${indent}${key}: ${serializeValue(value)},`)
    .join('\n');
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const css = readFileSync(join(here, '../src/styles/tokens.css'), 'utf8');
  const tokens = parseTokens(css);
  // Dark "stove" surface overrides (board §03.5) as a nested group so RN screens
  // read `tokens.stove.*` without any hand-maintained hex.
  const stove = parseScope(css, '.theme-stove');

  const out = `// GENERATED — run \`pnpm generate:tokens\` after editing src/styles/tokens.css. Do not edit by hand.
export const tokens = {
${serializeGroup(tokens, '  ')}
  stove: {
${serializeGroup(stove, '    ')}
  },
} as const;

export type Tokens = typeof tokens;
`;
  const outDir = join(here, '../src/tokens');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'native.ts'), out);
  process.stdout.write(`Wrote ${String(Object.keys(tokens).length)} tokens + stove group to src/tokens/native.ts\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
