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
const REFS_DIR = fileURLToPath(new URL('../references/', import.meta.url));
const REFS = `${REFS_DIR}manifest.json`;

/** Read a PNG's pixel width straight from the IHDR (bytes 16–19, big-endian). */
async function pngWidth(path: string): Promise<number> {
  const header = await readFile(path);
  return header.readUInt32BE(16);
}

interface ManifestEntry {
  kind: 'web' | 'mobile';
  file: string;
  label: string;
  section: string;
}

/**
 * Maps a mobile reference slug → the deep link that renders that frame state.
 *
 * These 11 are the *statically* reachable top-level screens: the expo-router
 * routes under apps/mobile/src/app render standalone (no required search param,
 * no prior app state). Every other mobile frame is a mid-flow / state-dependent
 * view and is deliberately left unmapped (the loop logs `SKIP … no deep link
 * mapped`), because reaching it by a bare deep link would require inventing UI:
 *   - open bottom sheets (category/location/best-by pickers, consume sheet,
 *     limit-hit sheet) — no addressable route;
 *   - mid-scan / mid-generate beats (detecting, review-items, thinking,
 *     drafting) — transient stream states;
 *   - home selecting / browse-pantry, cook new-tapped / resume — interaction
 *     or active-session state;
 *   - recipe detail + chat — need a real `[recipeId]` and tweak state;
 *   - paywall variant B, trial-ending, settings tiers (free/trial/pro),
 *     edit-ingredient — one route per file renders a single state; the variant
 *     comes from props/subscription state, not the URL.
 * These need app-side dev-only deep links (see docs/checklists/m9 + launch-readiness).
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
  // Normalize the native screenshot to the reference width (aspect-preserved)
  // so the committed actual is review-friendly and the sweep diff is meaningful
  // — sips is macOS-native, no runtime dep. Mirrors normalize.ts's resample.
  const refWidth = await pngWidth(`${REFS_DIR}${slug}.png`);
  await run('sips', ['--resampleWidth', String(refWidth), `${APP_DIR}${slug}.png`]);
  captured += 1;
  console.log(`captured → ${slug}.png (resized to ${String(refWidth)}px wide)`);
}
console.log(`mobile capture complete: ${String(captured)}/${String(mobile.length)} frames`);
