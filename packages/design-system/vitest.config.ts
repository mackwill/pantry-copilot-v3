import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    // RTL registers its render cleanup on the global afterEach hook
    globals: true,
  },
});
