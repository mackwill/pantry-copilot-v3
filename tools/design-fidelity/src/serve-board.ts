// Hermetic board server: static-serves the v2 design board with its three CDN
// script tags rewritten to the committed /vendor copies. The v2 source is never
// modified — the rewrite happens at serve time.
import { readFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const VENDOR_DIR = fileURLToPath(new URL('../vendor/', import.meta.url));
const DEFAULT_BOARD_DIR = fileURLToPath(
  new URL('../../../../pantry-copilot-v2/claudeDesignOutput/', import.meta.url),
);

export const BOARD_PORT = 4400;
export const BOARD_PAGE = '/All Screens.html';

const CDN_REWRITES: Record<string, string> = {
  'https://unpkg.com/react@18.3.1/umd/react.development.js': '/vendor/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js':
    '/vendor/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js': '/vendor/babel.min.js',
};

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

async function handle(
  req: IncomingMessage,
  res: ServerResponse,
  boardDir: string,
): Promise<void> {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  const fromVendor = pathname.startsWith('/vendor/');
  const rootDir = fromVendor ? VENDOR_DIR : boardDir;
  const relative = fromVendor
    ? pathname.slice('/vendor/'.length)
    : pathname === '/'
      ? BOARD_PAGE.slice(1)
      : pathname.slice(1);
  const filePath = resolve(join(rootDir, relative));
  if (!filePath.startsWith(resolve(rootDir) + sep)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  try {
    let body = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    if (ext === '.html') {
      let html = body.toString('utf8');
      for (const [cdnUrl, vendorPath] of Object.entries(CDN_REWRITES)) {
        html = html.replaceAll(cdnUrl, vendorPath);
      }
      body = Buffer.from(html, 'utf8');
    }
    res.writeHead(200, { 'content-type': MIME[ext] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}

export function startBoardServer(
  port: number = BOARD_PORT,
  boardDir: string = process.env['BOARD_DIR'] ?? DEFAULT_BOARD_DIR,
): Promise<Server> {
  const server = createServer((req, res) => {
    void handle(req, res, boardDir);
  });
  return new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(port, () => {
      resolvePromise(server);
    });
  });
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  await startBoardServer();
  console.log(`board: http://localhost:${String(BOARD_PORT)}${encodeURI(BOARD_PAGE)}`);
}
