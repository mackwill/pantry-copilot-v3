import { defineConfig } from 'vitest/config';

// Native primitives are written against react-native and tested on the
// react-native-web implementation; .web.* extensions take priority so
// react-native-svg resolves its DOM build.
export default defineConfig({
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      // Bare-specifier resolution lands on the native entry; point straight
      // at the DOM implementation.
      {
        find: /^react-native-svg$/,
        replacement: 'react-native-svg/lib/module/ReactNativeSVG.web.js',
      },
    ],
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.mjs',
      '.js',
      '.mts',
      '.ts',
      '.jsx',
      '.tsx',
      '.json',
    ],
  },
  test: {
    environment: 'jsdom',
    // RTL registers its render cleanup on the global afterEach hook
    globals: true,
    server: {
      deps: {
        // Must be transformed by vite (not loaded natively by node) so the
        // react-native alias and .web.* resolution apply inside them.
        inline: ['react-native-web', 'react-native-svg', 'lucide-react-native'],
      },
    },
  },
});
