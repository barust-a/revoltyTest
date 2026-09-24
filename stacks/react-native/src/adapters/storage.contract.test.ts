import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { StoragePort } from '../ports/storage';
import { createKvStorage, type KvLike } from './storageKv';
import { createMemoryStorage } from './storageMemory';

const PrefsSchema = z.object({ userName: z.string() });

function createFakeKv(): KvLike {
  const map = new Map<string, string>();
  return {
    getItemSync: (key) => map.get(key) ?? null,
    setItemSync: (key, value) => void map.set(key, value),
  };
}

// Every StoragePort implementation must pass this contract.
function storageContract(name: string, make: () => StoragePort) {
  describe(`StoragePort contract — ${name}`, () => {
    it('returns null for a missing key', () => {
      expect(make().get('missing', PrefsSchema)).toBeNull();
    });

    it('round-trips a valid value', () => {
      const storage = make();
      storage.set('prefs', { userName: 'Ada' });
      expect(storage.get('prefs', PrefsSchema)).toEqual({ userName: 'Ada' });
    });

    it('returns null (never throws) on schema-invalid data', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const storage = make();
      storage.set('prefs', { userName: 42 });
      expect(storage.get('prefs', PrefsSchema)).toBeNull();
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });
}

storageContract('memory adapter', () => createMemoryStorage());
storageContract('kv adapter (fake KvLike)', () => createKvStorage(createFakeKv()));

describe('kv adapter corruption handling', () => {
  it('returns null on corrupt JSON instead of crashing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const kv = createFakeKv();
    kv.setItemSync('prefs', '{not json');
    expect(createKvStorage(kv).get('prefs', PrefsSchema)).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
