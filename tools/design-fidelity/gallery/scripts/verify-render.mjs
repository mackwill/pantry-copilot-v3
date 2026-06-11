// Verifies the gallery actually renders: serves it with vite, loads it in
// chromium, fails on any console/page error, and saves a full-page screenshot.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = fileURLToPath(new URL('../../output/', import.meta.url));
await mkdir(outDir, { recursive: true });

const server = await createServer({ root, server: { port: 4411 } });
await server.listen();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${String(error)}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});

await page.goto('http://localhost:4411/', { waitUntil: 'networkidle' });
await page.waitForSelector('[data-gallery-section]');
const sections = await page.locator('[data-gallery-section]').count();

// Open the bottom sheet and confirm the dialog appears before the screenshot.
await page.getByRole('button', { name: 'Open bottom sheet' }).click();
await page.waitForSelector('[role="dialog"]');
await page.screenshot({ path: `${outDir}gallery-verify.png`, fullPage: true });

await browser.close();
await server.close();

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
if (sections < 11) {
  console.error(`expected 11 gallery sections, found ${sections}`);
  process.exit(1);
}
console.log(`gallery OK — ${sections} sections rendered; screenshot: ${outDir}gallery-verify.png`);
