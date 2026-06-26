// Captures the running mobile app's screens from a booted iOS simulator for
// fidelity comparison. Preconditions (maintainer-run; cannot run headless):
//   1. One iOS simulator booted (`xcrun simctl list devices booted`).
//   2. The Expo app running on it (`pnpm --filter @pantry/mobile start`, press i).
//   3. A frozen status bar for deterministic chrome:
//        xcrun simctl status_bar booted override --time "9:41" \
//          --batteryLevel 100 --batteryState charged --cellularBars 4 --wifiBars 3
//
// Each mapped frame is reached via its `pantrycopilot://` deep link, then
// screenshotted. Frames with no mapping (mid-flow sheets / interaction states
// that need app-side dev deep-links) are skipped and reported as missing — the
// sweep (sweep.ts) tracks them in the approval checklist.
import { execFile } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const APP_DIR = fileURLToPath(new URL('../output/app/', import.meta.url));
const REFS = fileURLToPath(new URL('../references/manifest.json', import.meta.url));

interface ManifestEntry {
  kind: 'web' | 'mobile';
  file: string;
  label: string;
  section: string;
}

/**
 * Maps a mobile reference slug → the deep link that renders that frame state.
 * Top-level screens are mapped here; mid-flow states (sheets open, scanning,
 * generating) need app-side dev-only deep links and are left for follow-up.
 */
const ROUTES: Record<string, string> = {
  'marketing-auth--mobile-login': 'pantrycopilot://login',
  'home--mobile-home': 'pantrycopilot://',
  'mobile-pantry-recipe--pantry-tap-to-cook': 'pantrycopilot://pantry',
  'cook-tab-library--mobile-cook-default': 'pantrycopilot://cook',
  'mobile-camera-scan-flow--1-viewfinder': 'pantrycopilot://scan',
  'result-after-generation--mobile-result': 'pantrycopilot://generate',
  'mobile-add-ingredient-edit-ingredient--add-ingredient': 'pantrycopilot://add-ingredient',
  'mobile-account--account': 'pantrycopilot://me',
  'paywall-variation-a--mobile-paywall': 'pantrycopilot://paywall',
  'free-trial-lifecycle--mobile-pre-trial-offer': 'pantrycopilot://trial',
  'subscription-in-settings--mobile-manage-subscription': 'pantrycopilot://manage',
};

await mkdir(APP_DIR, { recursive: true });
const manifest = JSON.parse(await readFile(REFS, 'utf8')) as ManifestEntry[];
const mobile = manifest.filter((m) => m.kind === 'mobile');

let captured = 0;
for (const entry of mobile) {
  const slug = entry.file.replace(/\.png$/, '');
  const deepLink = ROUTES[slug];
  if (deepLink === undefined) {
    console.warn(`SKIP ${slug}: no deep link mapped`);
    continue;
  }
  await run('xcrun', ['simctl', 'openurl', 'booted', deepLink]);
  await new Promise((r) => setTimeout(r, 1500));
  await run('xcrun', ['simctl', 'io', 'booted', 'screenshot', `${APP_DIR}${slug}.png`]);
  captured += 1;
  console.log(`captured → ${slug}.png`);
}
console.log(`mobile capture complete: ${String(captured)}/${String(mobile.length)} frames`);
