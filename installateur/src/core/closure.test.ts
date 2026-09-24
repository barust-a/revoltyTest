import { describe, expect, it } from 'vitest';

import {
  applyClosure,
  CONFIRM_WINDOW_MS,
  confirmSelfResolved,
  markOpened,
  nextVisitDue,
  reconcileAlerts,
} from './closure';
import type { Alert, Closure, DomainState, Manip, System } from './types';

const NOW = new Date('2026-09-24T13:00:00Z'); // jeu. 24 sept., 15:00 à Lyon

const system: System = {
  id: 'sys-petit',
  serial: 'RV-2031-4410',
  client: { name: 'Mme Petit', address: '14 rue Paul Bert, 69003 Lyon', phone: '0612345678' },
  city: 'Lyon 3',
  batteryLabel: 'Revolty 10 kWh · 4 modules',
  pilotMode: 'autoconsommation',
  configuration: 'verifiee',
  lastMeasureAt: '2026-09-24T12:48:00Z',
  installedAt: '2025-04-12T08:00:00Z',
  isNew: false,
};

const alert: Alert = {
  id: 'al-petit',
  systemId: 'sys-petit',
  severity: 'grave',
  title: 'La batterie ne se recharge plus',
  clientImpact: 'Plus de secours en cas de coupure',
  checks: ['Disjoncteur batterie'],
  manipType: 'remise_en_service',
  since: '2026-09-21T12:00:00Z',
  resolvedAt: null,
};

const manip: Manip = {
  id: 'mp-petit',
  systemId: 'sys-petit',
  type: 'remise_en_service',
  origin: 'alerte',
  alertId: 'al-petit',
  createdAt: '2026-09-21T12:30:00Z',
  dueAt: '2026-09-24T16:00:00Z',
  openedByInstaller: false,
  status: 'a_faire',
  reopened: false,
  transmitted: false,
  confirmBy: null,
  attempts: [],
};

function makeState(overrides: Partial<DomainState> = {}): DomainState {
  return {
    systems: [system],
    alerts: [alert],
    manips: [manip],
    queue: [],
    ...overrides,
  };
}

function attempt(overrides: Partial<Closure>): Closure {
  return {
    id: 'mp-petit-a1',
    manipId: 'mp-petit',
    result: 'resolu',
    actions: [],
    photos: [],
    arrivedAt: '2026-09-24T08:30:00Z',
    closedAt: '2026-09-24T09:00:00Z',
    ...overrides,
  };
}

const closureInputBase = {
  manipId: 'mp-petit',
  actions: ['Disjoncteur réarmé'],
  photos: [] as string[],
  arrivedAt: '2026-09-24T12:30:00Z',
};

describe('nextVisitDue', () => {
  it('is 18:00 Lyon on the next local day', () => {
    expect(nextVisitDue(NOW)).toBe('2026-09-25T16:00:00.000Z');
  });
});

describe('markOpened', () => {
  it('sets openedByInstaller true', () => {
    const state = makeState();
    const result = markOpened(state, 'mp-petit');
    expect(result.manips[0]!.openedByInstaller).toBe(true);
    expect(result).not.toBe(state);
  });

  it('is a no-op (same reference) when already true or the manip is unknown', () => {
    const openedState = makeState({ manips: [{ ...manip, openedByInstaller: true }] });
    expect(markOpened(openedState, 'mp-petit')).toBe(openedState);

    const state = makeState();
    expect(markOpened(state, 'unknown')).toBe(state);
  });
});

describe('applyClosure', () => {
  it('resolu with alert -> attente_confirmation, confirmBy +24h, queue item', () => {
    const state = makeState();
    const result = applyClosure(state, { ...closureInputBase, result: 'resolu' }, NOW);
    const updated = result.manips[0]!;

    expect(updated.status).toBe('attente_confirmation');
    expect(updated.confirmBy).toBe(new Date(NOW.getTime() + CONFIRM_WINDOW_MS).toISOString());
    expect(updated.reopened).toBe(false);
    expect(updated.attempts).toHaveLength(1);
    expect(updated.attempts[0]).toMatchObject({
      id: 'mp-petit-a1',
      result: 'resolu',
      closedAt: NOW.toISOString(),
    });

    expect(result.queue).toHaveLength(1);
    expect(result.queue[0]).toMatchObject({
      id: 'q-mp-petit-a1',
      kind: 'cloture',
      refId: 'mp-petit-a1',
      systemId: 'sys-petit',
      label: 'Clôture · Mme Petit',
      sync: 'en_attente',
      createdAt: NOW.toISOString(),
    });
  });

  it('resolu without alert -> cloturee', () => {
    const noAlertManip: Manip = {
      ...manip,
      id: 'mp-dupont',
      alertId: null,
      origin: 'installation',
    };
    const state = makeState({ manips: [noAlertManip] });
    const result = applyClosure(
      state,
      { ...closureInputBase, manipId: 'mp-dupont', result: 'resolu' },
      NOW,
    );
    const updated = result.manips[0]!;

    expect(updated.status).toBe('cloturee');
    expect(updated.confirmBy).toBeNull();
  });

  it('pas_resolu defaults to repasser -> a_faire, dueAt tomorrow 18:00 Lyon', () => {
    const state = makeState();
    const result = applyClosure(state, { ...closureInputBase, result: 'pas_resolu' }, NOW);
    const updated = result.manips[0]!;

    expect(updated.status).toBe('a_faire');
    expect(updated.dueAt).toBe('2026-09-25T16:00:00.000Z');
    expect(updated.transmitted).toBe(false);
    expect(updated.attempts).toHaveLength(1);
    expect(updated.attempts[0]!.result).toBe('pas_resolu');
    expect(updated.attempts[0]!.next).toBe('repasser');
  });

  it('pas_resolu + transmettre_revolty -> transmitted true, dueAt null', () => {
    const state = makeState();
    const result = applyClosure(
      state,
      { ...closureInputBase, result: 'pas_resolu', next: 'transmettre_revolty' },
      NOW,
    );
    const updated = result.manips[0]!;

    expect(updated.transmitted).toBe(true);
    expect(updated.dueAt).toBeNull();
    expect(updated.attempts[0]!.next).toBe('transmettre_revolty');
  });

  it('increments closure ids across attempts', () => {
    const state = makeState();
    const afterFirst = applyClosure(state, { ...closureInputBase, result: 'pas_resolu' }, NOW);
    const NOW2 = new Date('2026-09-25T13:00:00Z');
    const afterSecond = applyClosure(
      afterFirst,
      { ...closureInputBase, result: 'pas_resolu', arrivedAt: '2026-09-25T12:30:00Z' },
      NOW2,
    );
    const updated = afterSecond.manips[0]!;

    expect(updated.attempts.map((a) => a.id)).toEqual(['mp-petit-a1', 'mp-petit-a2']);
  });

  it('falls back to a plain label when the system is missing', () => {
    const orphanManip: Manip = {
      ...manip,
      id: 'mp-orphan',
      systemId: 'sys-missing',
      alertId: null,
    };
    const state = makeState({ manips: [orphanManip] });
    const result = applyClosure(
      state,
      { ...closureInputBase, manipId: 'mp-orphan', result: 'resolu' },
      NOW,
    );
    expect(result.queue[0]!.label).toBe('Clôture');
  });

  it('returns the same state reference for an unknown manip', () => {
    const state = makeState();
    const result = applyClosure(
      state,
      { ...closureInputBase, manipId: 'unknown', result: 'resolu' },
      NOW,
    );
    expect(result).toBe(state);
  });

  it('does not mutate inputs', () => {
    const state = makeState();
    const input = {
      ...closureInputBase,
      result: 'pas_resolu' as const,
      actions: ['a'],
      photos: [] as string[],
    };
    const actionsSnapshot = [...input.actions];

    applyClosure(state, input, NOW);

    expect(input.actions).toEqual(actionsSnapshot);
    expect(state.manips[0]!.attempts).toHaveLength(0);
    expect(state.queue).toHaveLength(0);
  });
});

describe('reconcileAlerts', () => {
  it('closes a never-opened a_faire manip once the alert lifts, without a queue item', () => {
    const resolvedAlert: Alert = { ...alert, resolvedAt: '2026-09-24T10:00:00Z' };
    const state = makeState({ alerts: [resolvedAlert] });

    const result = reconcileAlerts(state, NOW);
    const updated = result.manips[0]!;

    expect(updated.status).toBe('cloturee');
    expect(updated.attempts).toHaveLength(1);
    expect(updated.attempts[0]).toMatchObject({
      id: 'mp-petit-a1',
      result: 'auto_resolue',
      arrivedAt: '2026-09-24T10:00:00Z',
      closedAt: '2026-09-24T10:00:00Z',
    });
    expect(result.queue).toHaveLength(0);
  });

  it('moves an opened a_faire manip to a_confirmer once the alert lifts', () => {
    const resolvedAlert: Alert = { ...alert, resolvedAt: '2026-09-24T10:00:00Z' };
    const openedManip: Manip = { ...manip, openedByInstaller: true };
    const state = makeState({ alerts: [resolvedAlert], manips: [openedManip] });

    const result = reconcileAlerts(state, NOW);
    expect(result.manips[0]!.status).toBe('a_confirmer');
  });

  it('moves an a_confirmer manip back to a_faire when the alert is active again', () => {
    const waitingManip: Manip = { ...manip, status: 'a_confirmer', openedByInstaller: true };
    const state = makeState({ manips: [waitingManip] });

    const result = reconcileAlerts(state, NOW);
    expect(result.manips[0]!.status).toBe('a_faire');
  });

  it('closes an attente_confirmation manip once the alert lifts, keeping confirmBy', () => {
    const resolvedAlert: Alert = { ...alert, resolvedAt: '2026-09-24T09:00:00Z' };
    const confirmBy = '2026-09-25T09:00:00.000Z';
    const waitingManip: Manip = {
      ...manip,
      status: 'attente_confirmation',
      confirmBy,
      attempts: [attempt({ closedAt: '2026-09-24T09:00:00Z' })],
    };
    const state = makeState({ alerts: [resolvedAlert], manips: [waitingManip] });

    const result = reconcileAlerts(state, NOW);
    const updated = result.manips[0]!;

    expect(updated.status).toBe('cloturee');
    expect(updated.confirmBy).toBe(confirmBy);
  });

  it('reopens an attente_confirmation manip once the confirm window is over and the alert is still active', () => {
    const confirmBy = '2026-09-24T12:00:00.000Z'; // before NOW
    const waitingManip: Manip = { ...manip, status: 'attente_confirmation', confirmBy };
    const state = makeState({ manips: [waitingManip] }); // alert active

    const result = reconcileAlerts(state, NOW);
    const updated = result.manips[0]!;

    expect(updated.status).toBe('a_faire');
    expect(updated.reopened).toBe(true);
    expect(updated.confirmBy).toBeNull();
    expect(updated.dueAt).toBe('2026-09-25T16:00:00.000Z');
  });

  it('reopens a cloturee manip when the alert comes back within the confirm window', () => {
    const closedAt = '2026-09-24T09:00:00.000Z';
    const confirmBy = '2026-09-25T09:00:00.000Z'; // NOW is before this
    const activeAlert: Alert = { ...alert, since: '2026-09-24T12:00:00Z', resolvedAt: null };
    const closedManip: Manip = {
      ...manip,
      status: 'cloturee',
      confirmBy,
      attempts: [attempt({ closedAt })],
    };
    const state = makeState({ alerts: [activeAlert], manips: [closedManip] });

    const result = reconcileAlerts(state, NOW);
    const updated = result.manips[0]!;

    expect(updated.status).toBe('a_faire');
    expect(updated.reopened).toBe(true);
    expect(updated.confirmBy).toBeNull();
    expect(updated.dueAt).toBe('2026-09-25T16:00:00.000Z');
  });

  it('keeps a cloturee manip closed and clears confirmBy once the window is over', () => {
    const closedAt = '2026-09-23T09:00:00.000Z';
    const confirmBy = '2026-09-24T09:00:00.000Z'; // NOW is after this
    const activeAlert: Alert = { ...alert, since: '2026-09-24T10:00:00Z', resolvedAt: null };
    const closedManip: Manip = {
      ...manip,
      status: 'cloturee',
      confirmBy,
      attempts: [attempt({ closedAt })],
    };
    const state = makeState({ alerts: [activeAlert], manips: [closedManip] });

    const result = reconcileAlerts(state, NOW);
    const updated = result.manips[0]!;

    expect(updated.status).toBe('cloturee');
    expect(updated.confirmBy).toBeNull();
  });

  it('returns the same state reference when nothing changes', () => {
    const state = makeState(); // a_faire, alert still active
    const result = reconcileAlerts(state, NOW);
    expect(result).toBe(state);
  });
});

describe('confirmSelfResolved', () => {
  it('closes an a_confirmer manip and enqueues it', () => {
    const waitingManip: Manip = { ...manip, status: 'a_confirmer', openedByInstaller: true };
    const state = makeState({ manips: [waitingManip] });

    const result = confirmSelfResolved(state, 'mp-petit', NOW);
    const updated = result.manips[0]!;

    expect(updated.status).toBe('cloturee');
    expect(updated.attempts).toHaveLength(1);
    expect(updated.attempts[0]).toMatchObject({
      id: 'mp-petit-a1',
      result: 'auto_resolue',
      actions: [],
      photos: [],
      arrivedAt: NOW.toISOString(),
      closedAt: NOW.toISOString(),
    });

    expect(result.queue).toHaveLength(1);
    expect(result.queue[0]).toMatchObject({
      id: 'q-mp-petit-a1',
      kind: 'cloture',
      refId: 'mp-petit-a1',
      systemId: 'sys-petit',
      label: 'Clôture · Mme Petit',
      sync: 'en_attente',
    });
  });

  it('is a no-op (same reference) outside a_confirmer', () => {
    const state = makeState(); // status a_faire
    const result = confirmSelfResolved(state, 'mp-petit', NOW);
    expect(result).toBe(state);
  });
});
