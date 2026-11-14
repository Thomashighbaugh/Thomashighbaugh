// @ts-check

const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    ignores: ['node_modules/**', '.github/assets/**', 'coverage/**'],
  },

  js.configs.recommended,

  // TypeScript recommended (syntax-only rules, no type-aware 'unsafe-*' rules
  // that would fire on every JSDoc-typed variable in this codebase).
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // The project is CommonJS; require/module.exports are the norm.
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },

  {
    // Tests
    files: ['**/*.test.js', 'src/tests/**/*.js', 'test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },

  {
    // Build entry points read as scripts — console is fine there.
    files: ['src/index.js', 'src/vice-build.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // Must stay last — turns off every rule that conflicts with Prettier.
  prettier,
);
