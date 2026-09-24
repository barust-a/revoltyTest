import React, { createContext, useContext, useState } from 'react';
import { useStore } from 'zustand';

import type { Services } from '../ports/services';
import { createAppStore, type AppState, type AppStore } from '../state/appStore';

// Features reach the outside world ONLY through this context.
// Tests inject fakes (e.g. createMemoryStorage) by rendering their own AppProvider.

interface AppContextValue {
  services: Services;
  store: AppStore;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  services,
  children,
}: {
  services: Services;
  children: React.ReactNode;
}) {
  // Lazy one-time init: the store is created once per provider, not per render.
  const [value] = useState<AppContextValue>(() => ({
    services,
    store: createAppStore(services.storage),
  }));
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === null) throw new Error('AppProvider is missing above this component');
  return ctx;
}

export function useServices(): Services {
  return useAppContext().services;
}

// Always select a slice — never subscribe to the whole store.
export function useAppState<T>(selector: (state: AppState) => T): T {
  return useStore(useAppContext().store, selector);
}
