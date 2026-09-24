import type { ZodType } from 'zod';

// Schema-aware storage boundary: reads are ALWAYS validated.
export interface StoragePort {
  get<T>(key: string, schema: ZodType<T>): T | null;
  set(key: string, value: unknown): void;
}
