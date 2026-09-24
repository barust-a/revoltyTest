import Storage from 'expo-sqlite/kv-store';

import type { Services } from '../ports/services';
import { createKvStorage } from './storageKv';

// Composition root: the ONLY place adapters are assembled into Services.
// Imported exclusively by app/_layout.tsx — never by features.
export function createServices(): Services {
  return { storage: createKvStorage(Storage) };
}
