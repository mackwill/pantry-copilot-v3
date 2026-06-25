// Production server entry for the TanStack Start SSR build.
//
// `vite build` emits a web-standard fetch handler (`dist/server/server.js`)
// plus hashed client assets (`dist/client`), but no listening server. This
// entry binds them to an HTTP port via srvx (the same server runtime Start
// uses internally): static assets are served first, everything else falls
// through to the SSR handler.
import { fileURLToPath } from 'node:url';
import { serve } from 'srvx';
import { serveStatic } from 'srvx/static';
import handler from './dist/server/server.js';

const clientDir = fileURLToPath(new URL('./dist/client', import.meta.url));
const port = Number(process.env.PORT ?? '3000');
const hostname = process.env.HOST ?? '0.0.0.0';

serve({
  port,
  hostname,
  middleware: [serveStatic({ dir: clientDir })],
  fetch: (request) => handler.fetch(request),
});
