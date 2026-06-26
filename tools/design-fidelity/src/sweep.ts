// Full-board fidelity sweep: diff every manifest frame (web + mobile) against
// its captured counterpart in output/app, write a consolidated report + JSON,
// and fail (non-zero exit) only when an *already-captured* frame regresses past
// the tripwire. Missing captures are reported, not failed — they are tracked
// for human approval in docs/checklists/m9-fidelity-sweep.md.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const REFS = fileURLToPath(new URL('../references/', import.meta.url));
const APP = fileURLToPath(new URL('../output/app/', import.meta.url));
const OUT = fileURLToPath(new URL('../output/', import.meta.url));
const TRIPWIRE_PCT = Number(process.env['SWEEP_TRIPWIRE_PCT'] ?? '2');

interface ManifestEntry {
  kind: 'web' | 'mobile';
  file: string;
  label: string;
  section: string;
}
interface Row {
  slug: string;
  kind: string;
  mismatchPct: number;
  missing: boolean;
}

function pad(png: PNG, w: number, h: number): PNG {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

async function tryRead(path: string): Promise<PNG | null> {
  try {
    return PNG.sync.read(await readFile(path));
  } catch {
    return null;
  }
}

function reportHtml(rows: Row[]): string {
  const cells = rows
    .map((r) => {
      const status = r.missing ? 'missing' : `${r.mismatchPct.toFixed(2)}%`;
      const ref = `references/${r.slug}.png`;
      const act = `app/${r.slug}.png`;
      const diff = `${r.slug}/diff.png`;
      return `<tr><td>${r.slug}</td><td>${r.kind}</td><td>${status}</td>
<td><img loading="lazy" src="${ref}" width="160"></td>
<td>${r.missing ? '' : `<img loading="lazy" src="${act}" width="160">`}</td>
<td>${r.missing ? '' : `<img loading="lazy" src="${diff}" width="160">`}</td></tr>`;
    })
    .join('\n');
  return `<!doctype html><meta charset="utf-8"><title>M9 fidelity sweep</title>
<style>body{font:13px system-ui;margin:1rem}table{border-collapse:collapse}td{border:1px solid #ddd;padding:4px;vertical-align:top}</style>
<h1>M9 fidelity sweep</h1><p>Tripwire ${String(TRIPWIRE_PCT)}% on captured frames.</p>
<table><thead><tr><th>slug</th><th>kind</th><th>mismatch</th><th>reference</th><th>actual</th><th>diff</th></tr></thead>
<tbody>${cells}</tbody></table>`;
}

const manifest = JSON.parse(await readFile(`${REFS}manifest.json`, 'utf8')) as ManifestEntry[];
await mkdir(OUT, { recursive: true });

const rows: Row[] = [];
for (const entry of manifest) {
  const slug = entry.file.replace(/\.png$/, '');
  const ref = await tryRead(`${REFS}${entry.file}`);
  const act = await tryRead(`${APP}${slug}.png`);
  if (ref === null || act === null) {
    rows.push({ slug, kind: entry.kind, mismatchPct: 100, missing: true });
    continue;
  }
  const w = Math.max(ref.width, act.width);
  const h = Math.max(ref.height, act.height);
  const diff = new PNG({ width: w, height: h });
  const mismatched = pixelmatch(pad(ref, w, h).data, pad(act, w, h).data, diff.data, w, h, {
    threshold: 0.1,
  });
  await mkdir(`${OUT}${slug}/`, { recursive: true });
  await writeFile(`${OUT}${slug}/diff.png`, PNG.sync.write(diff));
  rows.push({ slug, kind: entry.kind, mismatchPct: (mismatched / (w * h)) * 100, missing: false });
}

rows.sort((a, b) => b.mismatchPct - a.mismatchPct);
await writeFile(`${OUT}sweep.json`, `${JSON.stringify(rows, null, 2)}\n`);
await writeFile(`${OUT}report.html`, reportHtml(rows));

const captured = rows.filter((r) => !r.missing);
const regressions = captured.filter((r) => r.mismatchPct > TRIPWIRE_PCT);
console.log(
  `swept ${String(rows.length)} frames · captured ${String(captured.length)} · ${String(rows.length - captured.length)} missing`,
);
console.log(`regressions over ${String(TRIPWIRE_PCT)}%: ${String(regressions.length)}`);
for (const r of regressions) console.log(`  ${r.slug} (${r.kind}) ${r.mismatchPct.toFixed(2)}%`);
if (regressions.length > 0) process.exit(1);
