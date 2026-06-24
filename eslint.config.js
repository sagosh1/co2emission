import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import unicorn from 'eslint-plugin-unicorn'
import sonarjs from 'eslint-plugin-sonarjs'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.stryker-tmp', 'reports', 'coverage']),

  {
    files: ["src/cli/**/*.{js,jsx}", "scripts/**/*.js"],
    languageOptions: {
      globals: globals.node,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      sonarjs.configs.recommended,
    ],
    plugins: {
      unicorn,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        caughtErrors: 'none',
      }],
      'complexity': ['warn', { max: 10 }],
      'max-depth': ['warn', { max: 4 }],
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
      'eqeqeq': ['error', 'always'],
      'no-console': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'object-shorthand': ['error', 'always'],
      'no-param-reassign': 'error',
      'no-shadow': 'error',
      'default-case': 'warn',
      'no-duplicate-imports': 'error',
      'no-implicit-coercion': 'error',
      'no-throw-literal': 'error',
      'radix': 'error',
      'semi': ['error', 'never'],
      'quotes': ['error', 'double', { avoidEscape: true }],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'comma-dangle': ['error', 'always-multiline'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'arrow-parens': ['error', 'always'],
      'space-before-function-paren': ['error', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-ternary': 'warn',
      'unicorn/throw-new-error': 'error',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/no-typeof-undefined': 'error',
      'unicorn/consistent-function-scoping': 'warn',
      'unicorn/prefer-logical-operator-over-ternary': 'warn',
      'sonarjs/cognitive-complexity': ['warn', 10],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 4 }],
    },
  },

  {
    files: ['**/*.jsx'],
    rules: {
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
    },
  },

  {
    files: ['**/*.test.{js,jsx}'],
    rules: {
      'max-lines-per-function': 'off',
      'no-shadow': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-useless-undefined': 'off',
      'sonarjs/cognitive-complexity': 'off',
    },
  },
])
