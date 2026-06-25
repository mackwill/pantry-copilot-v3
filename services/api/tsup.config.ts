import { defineConfig } from 'tsup';

/**
 * Bundles the API service into self-contained `dist` entrypoints. Internal
 * `@pantry/*` workspace packages ship raw TypeScript source, which `node`
 * cannot execute from `node_modules`; `noExternal` inlines them so the
 * production container runs `node dist/index.js` with no `.ts` at runtime.
 * Real npm dependencies stay external (provided by the deploy's node_modules).
 */
export default defineConfig({
  entry: ['src/index.ts', 'src/migrate.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  clean: true,
  noExternal: [/^@pantry\//],
  outExtension: () => ({ js: '.js' }),
});
