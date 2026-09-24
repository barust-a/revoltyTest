import { describe, expect, it } from 'vitest';

import { createTestServices } from '../adapters/testServices';
import { emptyDraft } from '../core/install';
import { buildPark } from '../core/park';
import { BATTERY_CONFIRM_DELAY_MS, createAppStore, DOMAIN_KEY } from './appStore';

function setup() {
  const test = createTestServices();
  const timers: { fn: () => void; ms: number }[] = [];
  const schedule = (fn: () => void, ms: number) => {
    timers.push({ fn, ms });
  };
  const store = createAppStore(test.services, { schedule });
  return { ...test, store, timers };
}

const RESOLU = {
  manipId: 'mp-petit',
  result: 'resolu' as const,
  actions: ['Disjoncteur réarmé'],
  photos: [],
  arrivedAt: '2026-09-24T12:40:00Z',
};

describe('app store', () => {
  it('starts from the demo state when nothing is saved', () => {
    const { store } = setup();
    expect(store.getState().domain.systems).toHaveLength(20);
    expect(store.getState().recoveredFromCorruption).toBe(false);
  });

  it('restores the saved domain state', () => {
    const test = createTestServices();
    const first = createAppStore(test.services, { schedule: () => undefined });
    first.getState().closeManip({ ...RESOLU, result: 'pas_resolu', next: 'repasser' });
    const second = createAppStore(test.services, { schedule: () => undefined });
    const manip = second.getState().domain.manips.find((m) => m.id === 'mp-petit');
    expect(manip?.attempts).toHaveLength(1);
  });

  it('falls back to the demo state and warns when the saved state is corrupt', () => {
    const test = createTestServices();
    test.services.storage.set(DOMAIN_KEY, { systems: 'nope' });
    const store = createAppStore(test.services, { schedule: () => undefined });
    expect(store.getState().recoveredFromCorruption).toBe(true);
    expect(store.getState().domain.systems).toHaveLength(20);
  });

  it('keeps an offline closure pending, then sends it when the network comes back', async () => {
    const { store } = setup();
    store.getState().setOffline(true);
    store.getState().closeManip(RESOLU);
    await store.getState().flushQueue();
    expect(store.getState().domain.queue[0]?.sync).toBe('en_attente');
    store.getState().setOffline(false);
    await store.getState().flushQueue();
    expect(store.getState().domain.queue[0]?.sync).toBe('envoyee');
  });

  it('shows a failed send and retries it', async () => {
    const { store } = setup();
    store.getState().armSendFailure();
    store.getState().closeManip(RESOLU);
    await store.getState().flushQueue();
    const item = store.getState().domain.queue[0];
    expect(item?.sync).toBe('echec');
    store.getState().retrySync(item?.id ?? '');
    await store.getState().flushQueue();
    expect(store.getState().domain.queue[0]?.sync).toBe('envoyee');
  });

  it('simulates the battery confirming a "Résolu" closure after 3 s', () => {
    const { store, timers, advance } = setup();
    store.getState().closeManip(RESOLU);
    expect(store.getState().domain.manips.find((m) => m.id === 'mp-petit')?.status).toBe(
      'attente_confirmation',
    );
    expect(timers[0]?.ms).toBe(BATTERY_CONFIRM_DELAY_MS);
    advance(BATTERY_CONFIRM_DELAY_MS);
    timers[0]?.fn();
    const state = store.getState().domain;
    expect(state.manips.find((m) => m.id === 'mp-petit')?.status).toBe('cloturee');
    expect(state.alerts.find((a) => a.id === 'al-petit')?.resolvedAt).not.toBeNull();
  });

  it('reopens the manip when the demo brings the problem back within 24 h', () => {
    const { store, timers, advance } = setup();
    store.getState().closeManip(RESOLU);
    advance(BATTERY_CONFIRM_DELAY_MS);
    timers[0]?.fn();
    advance(60_000);
    store.getState().bringAlertBack('sys-petit');
    const manip = store.getState().domain.manips.find((m) => m.id === 'mp-petit');
    expect(manip).toMatchObject({ status: 'a_faire', reopened: true });
  });

  it('groups the outage scenario and creates no individual manip for it', () => {
    const { store, services } = setup();
    const before = store.getState().domain.manips.length;
    store.getState().triggerOutage();
    store.getState().tick();
    const { domain } = store.getState();
    expect(
      buildPark(domain.systems, domain.alerts, services.clock.now()).outage?.systemIds,
    ).toHaveLength(7);
    expect(domain.manips).toHaveLength(before);
  });

  it('marks a manip as opened', () => {
    const { store } = setup();
    store.getState().openManip('mp-petit');
    expect(store.getState().domain.manips.find((m) => m.id === 'mp-petit')?.openedByInstaller).toBe(
      true,
    );
  });

  it('persists the install draft and clears it once the installation is done', () => {
    const { store } = setup();
    const draft = {
      ...emptyDraft(),
      step: 5,
      serial: 'RV-2150-3321',
      client: { name: 'M. Blanc', address: '10 rue Garibaldi, 69006 Lyon', phone: '', email: '' },
      comm: 'ok' as const,
      commSocPct: 54,
    };
    store.getState().saveInstallDraft(draft);
    expect(store.getState().installDraft).toEqual(draft);
    const id = store.getState().finishInstall(draft);
    expect(store.getState().installDraft).toBeNull();
    expect(store.getState().domain.systems.find((s) => s.id === id)?.isNew).toBe(true);
  });

  it('resets the demo', () => {
    const { store } = setup();
    store.getState().triggerOutage();
    store.getState().resetDemo();
    const { domain } = store.getState();
    expect(
      buildPark(domain.systems, domain.alerts, new Date('2026-09-24T13:00:00Z')).outage,
    ).toBeNull();
  });
});
