import { describe, expect, it } from 'vitest';

import { hash32 } from './hash';

describe('hash32', () => {
  it('is deterministic — same input, same output', () => {
    expect(hash32('hello')).toBe(hash32('hello'));
  });

  it('differs across inputs', () => {
    expect(hash32('hello')).not.toBe(hash32('hellp'));
  });

  it('returns an unsigned 32-bit integer', () => {
    const h = hash32('anything at all');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });

  it('handles the edge-case set', () => {
    for (const input of ['', 'a', '!!!', '🎮🎮', 'x'.repeat(200)]) {
      expect(hash32(input)).toBe(hash32(input));
    }
  });
});
