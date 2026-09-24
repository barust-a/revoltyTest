import React, { createContext, useContext, useEffect, useState } from 'react';
import { useStore } from 'zustand';

import type { Services } from '../ports/services';
import { createAppStore, type AppState, type AppStore } from '../state/appStore';

// Features reach the outside world ONLY through this context.
// Tests inject fakes (createTestServices) by rendering their own AppProvider with tickMs={0}.

interface AppContextValue {
  services: Services;
  store: AppStore;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  services,
  children,
  tickMs = 1000,
}: {
  services: Services;
  children: React.ReactNode;
  tickMs?: number;
}) {
  // Lazy one-time init: the store is created once per provider, not per render.
  const [value] = useState<AppContextValue>(() => ({
    services,
    store: createAppStore(services),
  }));

  // Time-based rules (grace period, 24 h confirmation, "il y a 12 min") move with the clock.
  useEffect(() => {
    const { store } = value;
    store.getState().tick();
    void store.getState().flushQueue();
    if (tickMs <= 0) return undefined;
    const id = setInterval(() => store.getState().tick(), tickMs);
    return () => clearInterval(id);
  }, [value, tickMs]);

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

export function useNow(): Date {
  return new Date(useAppState((s) => s.nowMs));
}
