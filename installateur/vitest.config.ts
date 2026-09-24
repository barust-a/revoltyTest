import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    exclude: ['**/*.native.test.ts', '**/node_modules/**'],
    environment: 'node',
  },
});
