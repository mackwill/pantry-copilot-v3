import globals from 'globals';
import tseslint from 'typescript-eslint';
import base from './packages/config/eslint.config.base.js';

export default tseslint.config(
  ...base,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // plain JS in this repo is node tooling (config files, scripts)
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: { globals: globals.node },
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // CommonJS config files (metro) have no import syntax
    files: ['**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // TanStack Router's control flow throws Redirect / NotFoundError by design
    files: ['apps/web/**/*.ts', 'apps/web/**/*.tsx'],
    rules: {
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            { from: 'package', name: 'Redirect', package: '@tanstack/router-core' },
            { from: 'package', name: 'NotFoundError', package: '@tanstack/router-core' },
          ],
        },
      ],
    },
  },
);
