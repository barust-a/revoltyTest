import { describe, expect, it } from 'vitest';

import { createLocalStorageKv } from './localStorageKv';

describe('localStorage-backed KvLike (web)', () => {
  it('reads and writes through the browser storage', () => {
    const map = new Map<string, string>();
    const kv = createLocalStorageKv({
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => void map.set(k, v),
    });
    kv.setItemSync('a', '1');
    expect(map.get('a')).toBe('1');
    expect(kv.getItemSync('a')).toBe('1');
    expect(kv.getItemSync('missing')).toBeNull();
  });

  it('falls back to memory when there is no localStorage (static rendering)', () => {
    const kv = createLocalStorageKv(undefined);
    kv.setItemSync('a', '1');
    expect(kv.getItemSync('a')).toBe('1');
  });
});
