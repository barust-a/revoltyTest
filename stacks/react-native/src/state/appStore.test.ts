import { describe, expect, it } from 'vitest';

import { createMemoryStorage } from '../adapters/storageMemory';
import { createAppStore, PREFS_KEY } from './appStore';

describe('appStore', () => {
  it('starts with an empty userName when storage is empty', () => {
    const store = createAppStore(createMemoryStorage());
    expect(store.getState().userName).toBe('');
  });

  it('persists userName through StoragePort and rehydrates in a new store', () => {
    const storage = createMemoryStorage();
    createAppStore(storage).getState().setUserName('Ada');
    expect(createAppStore(storage).getState().userName).toBe('Ada');
  });

  it('falls back to the default when persisted data is invalid', () => {
    const storage = createMemoryStorage();
    storage.set(PREFS_KEY, { userName: 42 });
    const store = createAppStore(storage);
    expect(store.getState().userName).toBe('');
  });
});
