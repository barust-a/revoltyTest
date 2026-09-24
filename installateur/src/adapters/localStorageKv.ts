import type { KvLike } from './storageKv';

type BrowserStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

// Web stand-in for expo-sqlite/kv-store (whose web build needs WASM + cross-origin headers).
export function createLocalStorageKv(storage: BrowserStorage | undefined): KvLike {
  if (storage === undefined) {
    const map = new Map<string, string>();
    return {
      getItemSync: (key) => map.get(key) ?? null,
      setItemSync: (key, value) => void map.set(key, value),
    };
  }
  return {
    getItemSync: (key) => storage.getItem(key),
    setItemSync: (key, value) => storage.setItem(key, value),
  };
}
