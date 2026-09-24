import type { ZodType } from 'zod';

import type { StoragePort } from '../ports/storage';

// Minimal surface of expo-sqlite/kv-store (kept as an interface so tests inject a fake).
export interface KvLike {
  getItemSync(key: string): string | null;
  setItemSync(key: string, value: string): void;
}

export function createKvStorage(kv: KvLike): StoragePort {
  return {
    get<T>(key: string, schema: ZodType<T>): T | null {
      const raw = kv.getItemSync(key);
      if (raw === null) return null;
      try {
        const parsed = schema.safeParse(JSON.parse(raw));
        if (!parsed.success) {
          console.warn(`[storage] invalid data for "${key}" — resetting`, parsed.error.message);
          return null;
        }
        return parsed.data;
      } catch (e) {
        console.warn(`[storage] corrupt JSON for "${key}" — resetting`, e);
        return null;
      }
    },
    set(key: string, value: unknown): void {
      kv.setItemSync(key, JSON.stringify(value));
    },
  };
}
