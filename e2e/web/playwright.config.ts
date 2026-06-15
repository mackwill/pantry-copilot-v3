import { defineConfig } from '@playwright/test';

const E2E_DATABASE_URL = (
  process.env['TEST_DATABASE_URL'] ?? 'postgres://pantry:pantry@localhost:5432/pantry'
).replace(/\/[^/]*$/, '/pantry_e2e');

// Shared bearer token between the e2e api ↔ ai services (ai requires ≥32 chars).
const AI_SERVICE_TOKEN = 'e2e-ai-service-token-e2e-ai-service-token';

export default defineConfig({
  testDir: './specs',
  globalSetup: './global-setup.ts',
  use: { baseURL: 'http://localhost:3000' },
  webServer: [
    {
      // Mock AI provider — the generation spec streams the deterministic tape.
      // A small per-frame delay keeps the Thinking/Drafting beats observable.
      command: 'pnpm --filter @pantry/ai dev',
      url: 'http://localhost:4001/health',
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'test',
        PORT: '4001',
        AI_SERVICE_TOKEN: AI_SERVICE_TOKEN,
        DEFAULT_AI_PROVIDER: 'mock',
        MOCK_STREAM_DELAY_MS: '100',
      },
    },
    {
      command: 'pnpm --filter @pantry/api dev',
      url: 'http://localhost:4000/health',
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: E2E_DATABASE_URL,
        BETTER_AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-xx',
        AUTH_DEV_MAGIC_LINK: 'true',
        // The dev default (10 auth requests/min) trips on the specs' combined
        // get-session traffic and silently bounces sessions via 429s.
        AUTH_RATE_LIMIT_MAX: '1000',
        RATE_LIMIT_MAX: '10000',
        AI_SERVICE_URL: 'http://localhost:4001',
        AI_SERVICE_TOKEN: AI_SERVICE_TOKEN,
      },
    },
    {
      command: 'pnpm --filter @pantry/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://localhost:4000' },
    },
  ],
});
