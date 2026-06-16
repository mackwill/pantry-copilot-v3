// Drives the running web app (localhost:3000) through the M4 §01/§04/§02 frames
// against the mock event tape and screenshots each at the board's 1280×861@2x.
// Streaming states are frozen by running the AI service with a high
// MOCK_STREAM_DELAY_MS and screenshotting at the right beat.
//
// Prereq: api (4000), web (3000), ai (4001, MOCK_STREAM_DELAY_MS≈1000) running.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';

const APP_DIR = fileURLToPath(new URL('../output/app/', import.meta.url));
const API = 'http://localhost:4000';
const WEB = 'http://localhost:3000';

await mkdir(APP_DIR, { recursive: true });

function isoIn(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const SEED = [
  { name: 'Whole milk', quantity: 0.5, unit: 'gallon', category: 'dairy', location: 'fridge_door', bestBy: isoIn(2) },
  { name: 'Scallions', quantity: 1, unit: 'bunch', category: 'produce', location: 'fridge_crisper', bestBy: isoIn(3) },
  { name: 'Apples', quantity: 2, unit: 'ea', category: 'produce', location: 'counter', bestBy: isoIn(-1) },
];

async function settleFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 861 }, deviceScaleFactor: 2 });
page.setDefaultTimeout(60_000); // first hit to each route triggers a cold Vite compile

// Sign up a fresh user through the UI.
const email = `fidelity-${Date.now().toString()}@example.com`;
await page.goto(`${WEB}/signup`, { waitUntil: 'networkidle' });
await page.getByLabel('Name').fill('Mara Quinn');
await page.getByLabel('Email').fill(email);
await page.getByLabel('Password').fill('hunter2hunter2');
await page.getByRole('button', { name: 'Create account' }).click();
await page.waitForURL(/\/home/);

// Seed pantry via tRPC (cookie travels with the page fetch).
for (const item of SEED) {
  await page.evaluate(
    async ({ api, body }) => {
      await fetch(`${api}/trpc/pantry.create`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ json: body }),
      });
    },
    { api: API, body: item },
  );
}

// ── §01 Home ──
await page.goto(`${WEB}/cook`, { waitUntil: 'networkidle' });
await page.getByText('What are you hungry for?').waitFor();
await settleFonts(page);
await page.waitForTimeout(400);
await page.screenshot({ path: `${APP_DIR}home--web-home.png` });
console.log('captured → home--web-home.png');

// Submit a prompt → generate route.
await page.getByLabel('Ask in your own words').fill('Cozy with milk and carrots, not too sweet');
await page.getByRole('button', { name: 'Cook this' }).click();
await page.waitForURL(/\/cook\/generate/);

// ── §04 Thinking ── (wait until the third tool call has streamed in, before drafting)
await page.getByText('search_pantry_combos()').waitFor();
await settleFonts(page);
await page.screenshot({ path: `${APP_DIR}generating-state--web-1-thinking.png` });
console.log('captured → generating-state--web-1-thinking.png');

// ── §04 Drafting ── (first recipe_partial flips status; grab before steps land)
await page.getByText('drafting', { exact: true }).waitFor();
await settleFonts(page);
await page.screenshot({ path: `${APP_DIR}generating-state--web-2-drafting.png` });
console.log('captured → generating-state--web-2-drafting.png');

// ── §02 Result ──
await page.getByRole('button', { name: /Start cooking/ }).waitFor();
await settleFonts(page);
await page.waitForTimeout(300);
await page.screenshot({ path: `${APP_DIR}result-after-generation--web-result.png` });
console.log('captured → result-after-generation--web-result.png');

await browser.close();
