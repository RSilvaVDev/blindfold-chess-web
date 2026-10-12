// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'coverage/',
      'node_modules/',
      'public/engine/',
      'eslint.config.mjs',
    ],
  },
  eslint.configs.recommended,
  // Type-aware rules: catch floating promises, unsafe `any` flow, and
  // conditions that are always true or false.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Node build scripts sit outside the TypeScript projects: no type info.
  {
    files: ['scripts/**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: globals.node,
    },
  },
  // Rules of Hooks, exhaustive deps, and the React Compiler purity checks.
  reactHooks.configs.flat.recommended,
  // Keeps component files hot-reloadable in Vite.
  reactRefresh.configs.vite,
  // Formatting is Prettier's job; turn off every rule that would fight it.
  prettier,
);
