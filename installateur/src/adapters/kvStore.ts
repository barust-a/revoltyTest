import Storage from 'expo-sqlite/kv-store';

import type { KvLike } from './storageKv';

// Native key-value store. The web build resolves kvStore.web.ts instead.
export const kvStore: KvLike = Storage;
