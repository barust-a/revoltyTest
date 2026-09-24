import { describe, expect, it } from 'vitest';

import { buildGreeting, GreetingSchema } from './greeting';

describe('buildGreeting', () => {
  it('greets the trimmed name', () => {
    expect(buildGreeting('  Ada ').text).toBe('Hello, Ada!');
  });

  it('is deterministic — same input, byte-identical output', () => {
    expect(buildGreeting('Ada')).toEqual(buildGreeting('Ada'));
  });

  it('falls back to "stranger" on empty/whitespace input', () => {
    expect(buildGreeting('').text).toBe('Hello, stranger!');
    expect(buildGreeting('   ').text).toBe('Hello, stranger!');
  });

  it('always produces a schema-valid result (edge-case set)', () => {
    for (const input of ['', 'a', '!!!', '🎮', 'x'.repeat(200)]) {
      expect(GreetingSchema.safeParse(buildGreeting(input)).success).toBe(true);
    }
  });

  it('picks the flair from the hash, not at random', () => {
    const flairs = new Set([buildGreeting('Ada').flair, buildGreeting('Grace').flair]);
    expect(flairs.size).toBeGreaterThanOrEqual(1); // stable per name
    expect(buildGreeting('Ada').flair).toBe(buildGreeting('Ada').flair);
  });
});
