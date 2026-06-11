// Screenshots each gallery section (by data-gallery-section id) for comparison
// against board references. Expects the gallery dev server to be running
// (pnpm --filter @pantry/design-fidelity-gallery dev).
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const GALLERY_URL = process.env['GALLERY_URL'] ?? 'http://localhost:4410/';
const OUT_DIR = fileURLToPath(new URL('../output/gallery/', import.meta.url));

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1400, height: 1000 },
  deviceScaleFactor: 2,
});
await page.goto(GALLERY_URL, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-gallery-section]');
await page.evaluate(async () => {
  await document.fonts.ready;
});

const sections = page.locator('[data-gallery-section]');
const total = await sections.count();
for (let i = 0; i < total; i += 1) {
  const section = sections.nth(i);
  const id = (await section.getAttribute('data-gallery-section')) ?? String(i);
  await section.scrollIntoViewIfNeeded();
  await section.screenshot({ path: `${OUT_DIR}${id}.png` });
  console.log(id);
}
await browser.close();
console.log(`captured ${String(total)} gallery sections → ${OUT_DIR}`);
