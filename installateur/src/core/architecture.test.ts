import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// Cheapest guardrail in the repo: core stays pure and deterministic.
// ESLint enforces the same rules; this test catches what slips past editors.

const CORE_DIR = join(__dirname);

function coreSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.ts') && !e.name.endsWith('.test.ts'))
    .map((e) => join(e.parentPath, e.name));
}

describe('src/core architecture guards', () => {
  const files = coreSourceFiles(CORE_DIR);

  it('has core source files to guard', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('never imports react/expo/react-native or outer layers', () => {
    const forbidden =
      /from\s+['"](react|expo|@expo\/|react-native|@react-native|\.\.\/(adapters|ports|state|ui|features))/;
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(forbidden);
    }
  });

  it('never calls Math.random or Date.now', () => {
    for (const file of files) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toContain('Math.random');
      expect(src, file).not.toContain('Date.now');
    }
  });
});
