// Shared helpers for the web fidelity-capture scripts (Phase A of the
// 2026-06-25 fidelity sweep plan). DRYs the signup + seed + screenshot pattern
// proven in capture-m4-web.ts so each per-milestone script stays composition-only.
//
// Prereq: the capture stack from Phase 0 is up — api (:4000), web (:3000),
// ai (:4001, mock + slow stream), postgres (podman `podman-postgres-1`).
//
// Seeding note: the api exposes **no** dev-only seed mutation (searched
// services/api/src — only subscription read/sync, cook.start, and the AI
// generate path exist). Subscription tier in particular has no setter
// procedure (only a RevenueCat webhook gated behind REVENUECAT_WEBHOOK_AUTH,
// which is unset in dev). So `seedState` seeds the **local dev postgres**
// directly via `podman exec … psql` — macOS/local-only, no new runtime dep,
// matching the plan's sips/simctl shell-out approach. It never adds a
// production endpoint.
import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium, type Browser, type Page } from 'playwright';

const run = promisify(execFile);

export const API = 'http://localhost:4000';
export const WEB = 'http://localhost:3000';
const APP_DIR = fileURLToPath(new URL('../output/app/', import.meta.url));
const PG_CONTAINER = 'podman-postgres-1';

/** ISO date (YYYY-MM-DD) `days` from today — for bestBy/purchasedAt fixtures. */
export function isoIn(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Shape accepted by `pantry.create` (the fields the fixtures set). */
export interface SeedPantryItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  location: string;
  bestBy?: string;
  purchasedAt?: string;
}

/** The 3-item milk/scallions/apples fixture lifted from capture-m4-web.ts. */
export const SEED_PANTRY: readonly SeedPantryItem[] = [
  { name: 'Whole milk', quantity: 0.5, unit: 'gallon', category: 'dairy', location: 'fridge_door', bestBy: isoIn(2) },
  { name: 'Scallions', quantity: 1, unit: 'bunch', category: 'produce', location: 'fridge_door', bestBy: isoIn(3) },
  { name: 'Apples', quantity: 2, unit: 'ea', category: 'produce', location: 'counter', bestBy: isoIn(-1) },
];

/**
 * A "full" 12-item pantry that reproduces the board's inventory frame counts:
 * 12 items · 2 expiring this week · 1 past prime · across 4 locations
 * (fridge_door / counter / pantry_upper / freezer).
 */
export const FULL_PANTRY: readonly SeedPantryItem[] = [
  { name: 'Whole milk', quantity: 0.5, unit: 'gallon', category: 'dairy', location: 'fridge_door', bestBy: isoIn(2), purchasedAt: isoIn(-5) },
  { name: 'Scallions', quantity: 1, unit: 'bunch', category: 'produce', location: 'fridge_door', bestBy: isoIn(3), purchasedAt: isoIn(-4) },
  { name: 'Apples', quantity: 2, unit: 'ea', category: 'produce', location: 'counter', bestBy: isoIn(-1), purchasedAt: isoIn(-12) },
  { name: 'Eggs', quantity: 6, unit: 'ea', category: 'dairy', location: 'fridge_door', bestBy: isoIn(14), purchasedAt: isoIn(-2) },
  { name: 'Carrots', quantity: 3, unit: 'ea', category: 'produce', location: 'fridge_door', bestBy: isoIn(8), purchasedAt: isoIn(-6) },
  { name: 'Soba noodles', quantity: 1, unit: 'pack', category: 'pantry', location: 'pantry_upper', bestBy: isoIn(180), purchasedAt: isoIn(-14) },
  { name: 'Chili crisp', quantity: 1, unit: 'jar', category: 'pantry', location: 'pantry_upper', bestBy: isoIn(240), purchasedAt: isoIn(-40) },
  { name: 'Anchovies', quantity: 1, unit: 'tin', category: 'pantry', location: 'pantry_upper', bestBy: isoIn(365), purchasedAt: isoIn(-80) },
  { name: 'Frozen peas', quantity: 1, unit: 'bag', category: 'freezer', location: 'freezer', bestBy: isoIn(300), purchasedAt: isoIn(-30) },
  { name: 'Vanilla ice cream', quantity: 1, unit: 'pack', category: 'freezer', location: 'freezer', bestBy: isoIn(200), purchasedAt: isoIn(-20) },
  { name: 'Pork dumplings', quantity: 1, unit: 'bag', category: 'protein', location: 'freezer', bestBy: isoIn(150), purchasedAt: isoIn(-10) },
  { name: 'Butter', quantity: 1, unit: 'stick', category: 'dairy', location: 'fridge_door', bestBy: isoIn(60), purchasedAt: isoIn(-3) },
];

/** A page sized to the board frame box (1280×861 @2x → 2560×1722 PNG). */
export async function newPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 861 }, deviceScaleFactor: 2 });
  page.setDefaultTimeout(60_000); // first hit to each route triggers a cold Vite compile
  return page;
}

export async function settleFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

/** Settle fonts, hold one frame, then screenshot to output/app/<slug>.png. */
export async function shoot(page: Page, slug: string): Promise<void> {
  await settleFonts(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${APP_DIR}${slug}.png` });
  console.log(`captured → ${slug}.png`);
}

/** Sign up a fresh `fidelity-<ts>@example.com` user via /signup → /home. */
export async function signUp(page: Page): Promise<string> {
  const email = `fidelity-${Date.now().toString()}@example.com`;
  await page.goto(`${WEB}/signup`, { waitUntil: 'networkidle' });
  await page.getByLabel('Name').fill('Mara Quinn');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('hunter2hunter2');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(/\/home/);
  return email;
}

/** POST each item to pantry.create (the session cookie travels with the fetch). */
export async function seedPantry(page: Page, items: readonly SeedPantryItem[]): Promise<void> {
  for (const item of items) {
    await page.evaluate(
      async ({ api, body }) => {
        const res = await fetch(`${api}/trpc/pantry.create`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ json: body }),
        });
        if (!res.ok) throw new Error(`pantry.create failed: ${res.status.toString()}`);
      },
      { api: API, body: item },
    );
  }
}

/**
 * Drive Home → generate → Result against the mock stream, leaving a single
 * saved recipe in the user's library. Resolves once the Result state renders.
 */
export async function generateRecipe(
  page: Page,
  prompt = 'Cozy with milk and carrots, not too sweet',
): Promise<void> {
  await page.goto(`${WEB}/home`, { waitUntil: 'networkidle' });
  await page.getByLabel('Ask in your own words').fill(prompt);
  await page.getByRole('button', { name: 'Cook this' }).click();
  await page.waitForURL(/\/cook\/generate/);
  await page.getByRole('button', { name: /Start cooking/ }).waitFor();
}

/**
 * Open the first library recipe (the most-recently generated one) and return
 * its id. Lands on /recipes/$recipeId.
 */
export async function openFirstRecipe(page: Page): Promise<string> {
  await page.goto(`${WEB}/recipes`, { waitUntil: 'networkidle' });
  await page.locator('a[href^="/recipes/"]').first().click();
  await page.waitForURL(/\/recipes\/[0-9a-f-]+/);
  await page.locator('h1').first().waitFor();
  const match = /\/recipes\/([0-9a-f-]+)/.exec(page.url());
  if (match?.[1] === undefined) throw new Error(`could not parse recipe id from ${page.url()}`);
  return match[1];
}

/** What `seedState` can establish for a captured user (all dev-DB writes). */
export interface SeedPayload {
  email: string;
  /** Flip the user's entitlement mirror to an active Pro subscription. */
  subscription?: 'pro';
  /** Burn the weekly recipe allowance (inserts dummy source='ai' recipes). */
  exhaustRecipeQuota?: boolean;
}

async function runSql(sql: string): Promise<void> {
  await run('podman', [
    'exec',
    PG_CONTAINER,
    'psql',
    '-U',
    'pantry',
    '-d',
    'pantry',
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    sql,
  ]);
}

/**
 * Seed dev-DB state that no UI flow can reach (subscription tier, exhausted
 * quota). Keyed by the signed-up email. See the file header for why this
 * writes postgres directly rather than calling a (non-existent) dev mutation.
 */
export async function seedState(payload: SeedPayload): Promise<void> {
  const email = payload.email.replace(/'/g, "''");
  if (payload.subscription === 'pro') {
    await runSql(
      `INSERT INTO user_subscriptions
         (user_id, rc_app_user_id, tier, is_pro, sub_state, product_identifier, period_type, expires_at, will_renew, store)
       SELECT id, id::text, 'pro', true, 'active', 'pantrycopilot_pro_monthly', 'normal', now() + interval '27 days', true, 'App Store'
       FROM users WHERE email = '${email}'
       ON CONFLICT (user_id) DO UPDATE SET
         tier = 'pro', is_pro = true, sub_state = 'active',
         product_identifier = 'pantrycopilot_pro_monthly', period_type = 'normal',
         expires_at = now() + interval '27 days', will_renew = true, store = 'App Store';`,
    );
  }
  if (payload.exhaustRecipeQuota === true) {
    await runSql(
      `INSERT INTO recipes (user_id, prompt, source, weirdness, title, data)
       SELECT u.id, 'quota filler', 'ai', 40, 'Filler ' || g::text, '{}'::jsonb
       FROM users u, generate_series(1, 3) g
       WHERE u.email = '${email}';`,
    );
  }
}

/** Launch headless chromium with the standard fidelity settings. */
export async function launch(): Promise<Browser> {
  await mkdir(APP_DIR, { recursive: true });
  return chromium.launch();
}
