// Captures per-frame reference screenshots from the design board.
// Web frames shoot `.web-frame .web-body`; mobile frames shoot the IOSDevice root.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { BOARD_PAGE, BOARD_PORT, startBoardServer } from './serve-board.js';

const REFS_DIR = fileURLToPath(new URL('../references/', import.meta.url));

interface ManifestEntry {
  section: string;
  label: string;
  kind: 'web' | 'mobile';
  file: string;
  width: number | null;
  height: number | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const server = await startBoardServer();
await mkdir(REFS_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1700, height: 1200 },
  deviceScaleFactor: 2,
});
await page.goto(`http://localhost:${String(BOARD_PORT)}${encodeURI(BOARD_PAGE)}`, {
  waitUntil: 'networkidle',
  timeout: 120_000,
});

// Babel compiles the board async — wait for frames to appear and the count to settle.
await page.waitForSelector('.frame', { timeout: 120_000 });
let previousCount = -1;
for (;;) {
  const count = await page.locator('.frame').count();
  if (count === previousCount) break;
  previousCount = count;
  await page.waitForTimeout(1500);
}
await page.evaluate(async () => {
  await document.fonts.ready;
});
await page.waitForTimeout(1000);

const frames = page.locator('.frame');
const total = await frames.count();
const manifest: ManifestEntry[] = [];
const usedSlugs = new Set<string>();

for (let i = 0; i < total; i += 1) {
  const frame = frames.nth(i);
  const label = (await frame.locator('.frame-label').first().innerText()).trim();
  const section = (
    await frame.evaluate(
      (el) => el.closest('.section')?.querySelector('.section-title')?.textContent ?? 'board',
    )
  ).trim();
  const isWeb = (await frame.locator('.web-frame').count()) > 0;
  const target = isWeb
    ? frame.locator('.web-frame .web-body').first()
    : frame.locator(':scope > div').last();

  const base = `${slugify(section)}--${slugify(label)}`;
  let slug = base;
  for (let n = 2; usedSlugs.has(slug); n += 1) slug = `${base}-${String(n)}`;
  usedSlugs.add(slug);

  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  await target.screenshot({ path: `${REFS_DIR}${slug}.png` });
  manifest.push({
    section,
    label,
    kind: isWeb ? 'web' : 'mobile',
    file: `${slug}.png`,
    width: box === null ? null : Math.round(box.width),
    height: box === null ? null : Math.round(box.height),
  });
  console.log(`${String(i + 1)}/${String(total)} ${slug}`);
}

await writeFile(`${REFS_DIR}manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
await browser.close();
server.close();
console.log(`captured ${String(total)} frames → ${REFS_DIR}`);
