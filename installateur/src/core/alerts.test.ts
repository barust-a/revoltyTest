import { describe, expect, it } from 'vitest';

import { HOUR } from './time';
import type { Alert, DomainState, System } from './types';
import {
  createManipFromAlert,
  dueToday,
  dueTomorrow,
  shouldCreateManip,
  spawnAlertManips,
} from './alerts';
import { DomainError } from './errors';

const NOW = new Date('2026-09-24T13:00:00Z'); // jeu. 24 sept., 15:00 à Lyon

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'al-1',
    systemId: 'sys-1',
    severity: 'grave',
    title: 'La batterie ne se recharge plus',
    clientImpact: 'Pas de secours en cas de coupure',
    checks: [],
    manipType: 'verifier_tore',
    since: '2026-09-24T10:00:00Z',
    resolvedAt: null,
    ...overrides,
  };
}

function makeSystem(overrides: Partial<System> = {}): System {
  return {
    id: 'sys-1',
    serial: 'RV-1234-5678',
    client: { name: 'Mme Lefèvre', address: '1 rue du Lac' },
    city: 'Bron',
    batteryLabel: 'Revolty 10 kWh · 4 modules',
    pilotMode: 'autoconsommation',
    configuration: 'verifiee',
    lastMeasureAt: '2026-09-24T12:00:00Z',
    installedAt: '2026-01-01T00:00:00Z',
    isNew: false,
    ...overrides,
  };
}

function emptyState(overrides: Partial<DomainState> = {}): DomainState {
  return { systems: [makeSystem()], alerts: [], manips: [], queue: [], ...overrides };
}

describe('shouldCreateManip', () => {
  it('is false 29 minutes after a grave alert started', () => {
    const alert = makeAlert({ since: new Date(NOW.getTime() - 29 * 60_000).toISOString() });
    expect(shouldCreateManip(alert, NOW)).toBe(false);
  });

  it('is true exactly 30 minutes after a grave alert started', () => {
    const alert = makeAlert({ since: new Date(NOW.getTime() - 30 * 60_000).toISOString() });
    expect(shouldCreateManip(alert, NOW)).toBe(true);
  });

  it('is false for a mineure alert', () => {
    const alert = makeAlert({
      severity: 'mineure',
      since: new Date(NOW.getTime() - HOUR).toISOString(),
    });
    expect(shouldCreateManip(alert, NOW)).toBe(false);
  });

  it('is false for a resolved alert', () => {
    const alert = makeAlert({
      since: new Date(NOW.getTime() - HOUR).toISOString(),
      resolvedAt: NOW.toISOString(),
    });
    expect(shouldCreateManip(alert, NOW)).toBe(false);
  });
});

describe('dueToday / dueTomorrow', () => {
  it('dueToday returns 18h00 Lyon today (16:00 UTC) before that hour', () => {
    expect(dueToday(NOW)).toBe('2026-09-24T16:00:00.000Z');
  });

  it('dueToday rolls over to tomorrow 18:00 Lyon once past it', () => {
    const after = new Date('2026-09-24T17:00:00Z'); // 19:00 Lyon
    expect(dueToday(after)).toBe('2026-09-25T16:00:00.000Z');
  });

  it('dueTomorrow is always 18:00 Lyon the next local day', () => {
    expect(dueTomorrow(NOW)).toBe('2026-09-25T16:00:00.000Z');
  });
});

describe('spawnAlertManips', () => {
  it('creates exactly one manip for a spawnable alert, and is idempotent', () => {
    const alert = makeAlert({ since: new Date(NOW.getTime() - HOUR).toISOString() });
    const state = emptyState({ alerts: [alert] });

    const next = spawnAlertManips(state, NOW);
    expect(next.manips).toHaveLength(1);
    expect(next.manips[0]?.alertId).toBe('al-1');
    expect(next.manips[0]?.status).toBe('a_faire');

    const again = spawnAlertManips(next, NOW);
    expect(again).toBe(next);
  });

  it('does not spawn a manip for an excluded system', () => {
    const alert = makeAlert({ since: new Date(NOW.getTime() - HOUR).toISOString() });
    const state = emptyState({ alerts: [alert] });
    const next = spawnAlertManips(state, NOW, ['sys-1']);
    expect(next.manips).toHaveLength(0);
  });

  it('returns the same reference when nothing changes', () => {
    const state = emptyState({ alerts: [] });
    expect(spawnAlertManips(state, NOW)).toBe(state);
  });
});

describe('createManipFromAlert', () => {
  it('creates a manip from a mineure alert', () => {
    const alert = makeAlert({ severity: 'mineure' });
    const state = emptyState({ alerts: [alert] });
    const next = createManipFromAlert(state, 'al-1', NOW);
    expect(next.manips).toHaveLength(1);
    expect(next.manips[0]?.alertId).toBe('al-1');
    expect(next.manips[0]?.dueAt).toBe(dueTomorrow(NOW));
  });

  it('does not duplicate when an open manip already exists for that alert', () => {
    const alert = makeAlert({ severity: 'mineure' });
    const state = emptyState({ alerts: [alert] });
    const next = createManipFromAlert(state, 'al-1', NOW);
    const again = createManipFromAlert(next, 'al-1', NOW);
    expect(again.manips).toHaveLength(1);
  });

  it('throws DomainError for an unknown alert', () => {
    const state = emptyState();
    expect(() => createManipFromAlert(state, 'unknown', NOW)).toThrow(DomainError);
  });
});
