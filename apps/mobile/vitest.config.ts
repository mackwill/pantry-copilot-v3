import { defineConfig } from 'vitest/config';

// Native code is written against react-native and tested on the
// react-native-web implementation; mirrors packages/design-system's
// proven alias + .web.* extension + inlined-deps setup.
export default defineConfig({
  resolve: {
    // Design-system components must share this app's react copy.
    dedupe: ['react', 'react-dom', 'react-native-web'],
    // String keys (not regexes) — some resolution stages skip regex aliases.
    // Order matters: the svg entry must win before the react-native prefix.
    alias: {
      'react-native-svg': 'react-native-svg/lib/module/ReactNativeSVG.web.js',
      'react-native': 'react-native-web',
    },
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
    include: ['src/**/*.test.{ts,tsx}'],
    server: {
      deps: {
        inline: ['react-native-web', 'react-native-svg', 'lucide-react-native'],
      },
    },
  },
});
