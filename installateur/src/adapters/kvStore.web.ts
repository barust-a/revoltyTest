import { createLocalStorageKv } from './localStorageKv';
import type { KvLike } from './storageKv';

export const kvStore: KvLike = createLocalStorageKv(
  typeof localStorage === 'undefined' ? undefined : localStorage,
);
