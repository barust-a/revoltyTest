const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

const OUTER_LAYERS = ['**/adapters/**', '**/ports/**', '**/state/**', '**/ui/**', '**/features/**'];

module.exports = defineConfig([
  ...expoConfig,
  { ignores: ['dist/*', 'node_modules/*', '.expo/*', 'android/*', 'ios/*'] },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'expo',
                'expo-*',
                '@expo/*',
                '*react-native*',
                '@react-native/*',
                '@react-native-community/*',
              ],
              message: 'src/core is pure TypeScript — no React/RN/Expo imports.',
            },
            { group: OUTER_LAYERS, message: 'src/core must not depend on outer layers.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    ignores: ['src/core/**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: 'Math.random is forbidden in core — derive variation from hash32.',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Date.now is forbidden in core — core must be deterministic.',
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/ui/**/*.{ts,tsx}'],
    // Tests may import fake adapters (e.g. storageMemory) — injecting fakes is the intended seam.
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/adapters/**'],
              message: 'Use ports via AppProvider, never adapters directly.',
            },
          ],
        },
      ],
    },
  },
]);
