import { z } from 'zod';
import { createStore } from 'zustand';

import { createManipFromAlert, spawnAlertManips } from '../core/alerts';
import {
  applyClosure,
  confirmSelfResolved,
  markOpened,
  reconcileAlerts,
  type ClosureInput,
} from '../core/closure';
import { completeInstallation, InstallDraftSchema, type InstallDraft } from '../core/install';
import { buildPark } from '../core/park';
import { nextToSend, retry, setSync } from '../core/sync';
import { DomainStateSchema, type DomainState } from '../core/types';
import type { Services } from '../ports/services';

// One store, sliced by concern. Business rules live in core/; actions only orchestrate
// them with the ports (clock, network, storage) and persist the domain state.

export const DOMAIN_KEY = 'domain.v1';
export const DRAFT_KEY = 'install-draft.v1';
// Prototype stand-in for the battery confirming a "Résolu" closure (spec: within 24 h).
export const BATTERY_CONFIRM_DELAY_MS = 3000;

export interface AppState {
  domain: DomainState;
  nowMs: number;
  offline: boolean;
  dataAsOf: string;
  recoveredFromCorruption: boolean;
  installDraft: InstallDraft | null;
  tick: () => void;
  refresh: () => void;
  openManip: (manipId: string) => void;
  closeManip: (input: ClosureInput) => void;
  confirmSelfResolved: (manipId: string) => void;
  createManipFromAlert: (alertId: string) => void;
  retrySync: (queueId: string) => void;
  flushQueue: () => Promise<void>;
  setOffline: (offline: boolean) => void;
  armSendFailure: () => void;
  triggerOutage: () => void;
  bringAlertBack: (systemId: string) => void;
  resetDemo: () => void;
  saveInstallDraft: (draft: InstallDraft) => void;
  finishInstall: (draft: InstallDraft) => string;
  dismissRecovery: () => void;
}

type Options = { schedule?: (fn: () => void, ms: number) => void };

function loadDomain(services: Services): { domain: DomainState; corrupted: boolean } {
  const saved = services.storage.get(DOMAIN_KEY, DomainStateSchema);
  if (saved !== null) {
    // A send interrupted by the app being killed must be retried, not shown as in flight.
    const queue = saved.queue.map((q) =>
      q.sync === 'envoi' ? { ...q, sync: 'en_attente' as const } : q,
    );
    return { domain: { ...saved, queue }, corrupted: false };
  }
  const corrupted = services.storage.get(DOMAIN_KEY, z.unknown()) !== null;
  return { domain: services.demo.initialState(), corrupted };
}

export function createAppStore(services: Services, { schedule = setTimeout }: Options = {}) {
  const { storage, clock, network, sync, haptics, demo } = services;
  const loaded = loadDomain(services);
  const nowIso = () => clock.now().toISOString();
  let flushing: Promise<void> | null = null;

  return createStore<AppState>()((set, get) => {
    const commit = (domain: DomainState) => {
      set({ domain });
      storage.set(DOMAIN_KEY, domain);
    };

    const update = (fn: (d: DomainState) => DomainState) => {
      const current = get().domain;
      const next = fn(current);
      if (next !== current) commit(next);
    };

    const reconcile = (d: DomainState): DomainState => {
      const now = clock.now();
      const outage = buildPark(d.systems, d.alerts, now).outage?.systemIds ?? [];
      return reconcileAlerts(spawnAlertManips(d, now, outage), now);
    };

    const runFlush = async () => {
      for (;;) {
        if (get().offline) return;
        const item = nextToSend(get().domain.queue);
        if (item === null) return;
        update((d) => ({ ...d, queue: setSync(d.queue, item.id, 'envoi') }));
        try {
          await sync.send(item);
          update((d) => ({ ...d, queue: setSync(d.queue, item.id, 'envoyee') }));
          set({ dataAsOf: nowIso() });
        } catch {
          update((d) => ({ ...d, queue: setSync(d.queue, item.id, 'echec') }));
        }
      }
    };

    return {
      domain: loaded.domain,
      nowMs: clock.now().getTime(),
      offline: !network.isOnline(),
      dataAsOf: nowIso(),
      recoveredFromCorruption: loaded.corrupted,
      installDraft: storage.get(DRAFT_KEY, InstallDraftSchema.nullable()),

      tick: () => {
        update(reconcile);
        set({ nowMs: clock.now().getTime() });
      },

      refresh: () => {
        get().tick();
        if (!get().offline) set({ dataAsOf: nowIso() });
      },

      openManip: (manipId) => update((d) => markOpened(d, manipId)),

      closeManip: (input) => {
        update((d) => applyClosure(d, input, clock.now()));
        haptics.success();
        void get().flushQueue();
        const manip = get().domain.manips.find((m) => m.id === input.manipId);
        const alertId = manip?.alertId ?? null;
        if (input.result === 'resolu' && alertId !== null) {
          schedule(() => {
            const stillWaiting = get().domain.manips.some(
              (m) => m.id === input.manipId && m.status === 'attente_confirmation',
            );
            if (!stillWaiting) return;
            const at = nowIso();
            update((d) =>
              reconcile({
                ...d,
                alerts: d.alerts.map((a) => (a.id === alertId ? { ...a, resolvedAt: at } : a)),
              }),
            );
          }, BATTERY_CONFIRM_DELAY_MS);
        }
      },

      confirmSelfResolved: (manipId) => {
        update((d) => confirmSelfResolved(d, manipId, clock.now()));
        void get().flushQueue();
      },

      createManipFromAlert: (alertId) =>
        update((d) => createManipFromAlert(d, alertId, clock.now())),

      retrySync: (queueId) => {
        update((d) => ({ ...d, queue: retry(d.queue, queueId) }));
        void get().flushQueue();
      },

      flushQueue: () => {
        flushing ??= runFlush().finally(() => {
          flushing = null;
        });
        return flushing;
      },

      setOffline: (offline) => {
        network.setOffline(offline);
        set({ offline });
        if (!offline) {
          set({ dataAsOf: nowIso() });
          void get().flushQueue();
        }
      },

      armSendFailure: () => network.failNextSend(),

      triggerOutage: () => update((d) => reconcile(demo.applyOutage(d))),

      bringAlertBack: (systemId) =>
        update((d) => reconcile(demo.bringAlertBack(d, systemId, clock.now()))),

      resetDemo: () => {
        commit(demo.initialState());
        storage.set(DRAFT_KEY, null);
        network.setOffline(false);
        set({
          installDraft: null,
          offline: false,
          recoveredFromCorruption: false,
          dataAsOf: nowIso(),
        });
      },

      saveInstallDraft: (draft) => {
        storage.set(DRAFT_KEY, draft);
        set({ installDraft: draft });
      },

      finishInstall: (draft) => {
        const { state, systemId } = completeInstallation(get().domain, draft, clock.now());
        commit(state);
        storage.set(DRAFT_KEY, null);
        set({ installDraft: null });
        haptics.success();
        void get().flushQueue();
        return systemId;
      },

      dismissRecovery: () => set({ recoveredFromCorruption: false }),
    };
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
