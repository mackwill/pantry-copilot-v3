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
);
