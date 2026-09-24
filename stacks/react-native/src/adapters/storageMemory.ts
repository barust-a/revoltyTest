import type { ZodType } from 'zod';

import type { StoragePort } from '../ports/storage';

// In-memory StoragePort for tests and previews. JSON round-trip mimics real serialization.
export function createMemoryStorage(): StoragePort {
  const map = new Map<string, string>();
  return {
    get<T>(key: string, schema: ZodType<T>): T | null {
      const raw = map.get(key);
      if (raw === undefined) return null;
      const parsed = schema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        console.warn(`[storage] invalid data for "${key}" — resetting`, parsed.error.message);
        return null;
      }
      return parsed.data;
    },
    set(key: string, value: unknown): void {
      map.set(key, JSON.stringify(value));
    },
  };
}
