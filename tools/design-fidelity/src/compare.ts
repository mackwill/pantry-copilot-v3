// Compares a reference screenshot against an actual one: pixelmatch diff +
// a self-contained side-by-side HTML report. Rows accumulate in output/report.json;
// report.html is regenerated on every run.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const OUT_DIR = fileURLToPath(new URL('../output/', import.meta.url));

interface ReportRow {
  slug: string;
  mismatchPct: number;
  reference: string;
  actual: string;
  diff: string;
}

function padTo(png: PNG, width: number, height: number): PNG {
  if (png.width === width && png.height === height) return png;
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

function renderReport(rows: ReportRow[]): string {
  const body = rows
    .map(
      (row) => `
  <section>
    <h2>${row.slug} — <strong>${row.mismatchPct.toFixed(3)}%</strong> mismatch</h2>
    <div class="cols">
      <figure><figcaption>reference</figcaption><img src="${row.reference}" /></figure>
      <figure><figcaption>actual</figcaption><img src="${row.actual}" /></figure>
      <figure><figcaption>diff</figcaption><img src="${row.diff}" /></figure>
    </div>
  </section>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>design-fidelity report</title>
<style>
  body { font: 14px system-ui; margin: 24px; background: #fafaf7; color: #0e120e; }
  h2 { font-weight: 500; }
  .cols { display: flex; gap: 16px; align-items: flex-start; }
  figure { margin: 0; flex: 1; min-width: 0; }
  figcaption { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8a8f88; margin-bottom: 6px; }
  img { width: 100%; border: 1px solid #e6e6e0; border-radius: 6px; background: white; }
  section { margin-bottom: 40px; }
</style></head><body>${body}
</body></html>
`;
}

const [referencePath, actualPath] = process.argv.slice(2);
if (referencePath === undefined || actualPath === undefined) {
  console.error('usage: compare <reference.png> <actual.png>');
  process.exit(1);
}

const reference = PNG.sync.read(await readFile(referencePath));
const actual = PNG.sync.read(await readFile(actualPath));
const width = Math.max(reference.width, actual.width);
const height = Math.max(reference.height, actual.height);
const diff = new PNG({ width, height });
const mismatched = pixelmatch(
  padTo(reference, width, height).data,
  padTo(actual, width, height).data,
  diff.data,
  width,
  height,
  { threshold: 0.1 },
);
const mismatchPct = (mismatched / (width * height)) * 100;

const slug = basename(referencePath, '.png');
const rowDir = `${OUT_DIR}${slug}/`;
await mkdir(rowDir, { recursive: true });
await writeFile(`${rowDir}diff.png`, PNG.sync.write(diff));
await copyFile(referencePath, `${rowDir}reference.png`);
await copyFile(actualPath, `${rowDir}actual.png`);

const reportJson = `${OUT_DIR}report.json`;
let rows: ReportRow[] = [];
try {
  rows = JSON.parse(await readFile(reportJson, 'utf8')) as ReportRow[];
} catch {
  rows = [];
}
rows = rows.filter((row) => row.slug !== slug);
rows.push({
  slug,
  mismatchPct,
  reference: `${slug}/reference.png`,
  actual: `${slug}/actual.png`,
  diff: `${slug}/diff.png`,
});
rows.sort((a, b) => b.mismatchPct - a.mismatchPct);
await writeFile(reportJson, `${JSON.stringify(rows, null, 2)}\n`);
await writeFile(`${OUT_DIR}report.html`, renderReport(rows));

console.log(`${slug}: ${mismatchPct.toFixed(3)}% mismatch → ${OUT_DIR}report.html`);
