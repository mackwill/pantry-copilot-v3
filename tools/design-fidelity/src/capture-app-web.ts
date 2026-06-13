// Captures the running web app's screens for fidelity comparison.
// Precondition: api on :4000 and web on :3000 are already running.
// Browser settings mirror capture-references.ts (frame box 1280×861 @2x).
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const APP_DIR = fileURLToPath(new URL('../output/app/', import.meta.url));

await mkdir(APP_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 861 },
  deviceScaleFactor: 2,
});

await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  await document.fonts.ready;
});

// The board's reference frame shows populated fields.
await page.locator('input[name=email]').fill('mara@home.kitchen');
await page.locator('input[name=password]').fill('kitchenkitch');
await page.evaluate(() => {
  (document.activeElement as HTMLElement | null)?.blur();
});
await page.waitForTimeout(300);

await page.screenshot({ path: `${APP_DIR}marketing-auth--web-login.png` });
await browser.close();
console.log(`captured → ${APP_DIR}marketing-auth--web-login.png`);
