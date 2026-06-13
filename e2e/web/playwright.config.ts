import { defineConfig } from '@playwright/test';

const E2E_DATABASE_URL = (
  process.env['TEST_DATABASE_URL'] ?? 'postgres://pantry:pantry@localhost:5432/pantry'
).replace(/\/[^/]*$/, '/pantry_e2e');

export default defineConfig({
  testDir: './specs',
  globalSetup: './global-setup.ts',
  use: { baseURL: 'http://localhost:3000' },
  webServer: [
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
