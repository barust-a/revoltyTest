import { z } from 'zod';
import { createStore } from 'zustand';

import type { StoragePort } from '../ports/storage';

// One store, sliced by concern. Persist ONLY user preferences; rehydration is zod-validated.

export const PREFS_KEY = 'prefs.v1';

const PrefsSchema = z.object({ userName: z.string() });
type Prefs = z.infer<typeof PrefsSchema>;

export interface AppState {
  userName: string;
  setUserName: (name: string) => void;
}

export function createAppStore(storage: StoragePort) {
  const initial = storage.get(PREFS_KEY, PrefsSchema);
  return createStore<AppState>()((set) => ({
    userName: initial?.userName ?? '',
    setUserName: (name) => {
      set({ userName: name });
      storage.set(PREFS_KEY, { userName: name } satisfies Prefs);
    },
  }));
}

export type AppStore = ReturnType<typeof createAppStore>;
