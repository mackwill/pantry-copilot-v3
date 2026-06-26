import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Default resolves from this file so the check is CWD-independent (pnpm
// --filter runs scripts in the package dir); an explicit arg overrides it.
const DEFAULT_DIR = fileURLToPath(new URL('../../apps/web/dist/client', import.meta.url));
const ASSET_DIR = process.argv[2] ?? DEFAULT_DIR;
const MAX_KB = Number(process.env['WEB_BUNDLE_MAX_KB'] ?? '1500');

async function totalJsBytes(dir: string): Promise<number> {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += await totalJsBytes(full);
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))
      total += (await stat(full)).size;
  }
  return total;
}

const kb = Math.round((await totalJsBytes(ASSET_DIR)) / 1024);
console.log(`web client JS: ${String(kb)} KB (budget ${String(MAX_KB)} KB)`);
if (kb > MAX_KB) {
  console.error(`bundle budget exceeded by ${String(kb - MAX_KB)} KB`);
  process.exit(1);
}
