import { describe, expect, it } from 'vitest';

import type { Alert, System } from './types';
import { activeAlertsFor, deriveHealth } from './health';

const NOW = new Date('2026-09-24T13:00:00Z'); // jeu. 24 sept., 15:00 à Lyon

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

describe('activeAlertsFor', () => {
  it('returns only active alerts of the given system, oldest since first', () => {
    const alerts: Alert[] = [
      makeAlert({ id: 'a1', since: '2026-09-24T11:00:00Z' }),
      makeAlert({ id: 'a2', since: '2026-09-24T09:00:00Z' }),
      makeAlert({ id: 'a3', systemId: 'sys-2' }),
      makeAlert({ id: 'a4', resolvedAt: '2026-09-24T12:00:00Z' }),
    ];
    expect(activeAlertsFor('sys-1', alerts).map((a) => a.id)).toEqual(['a2', 'a1']);
  });
});

describe('deriveHealth', () => {
  it('is en_panne when a grave and a mineure alert are both active, reporting the grave one', () => {
    const system = makeSystem();
    const alerts: Alert[] = [
      makeAlert({ id: 'grave', severity: 'grave', title: 'La batterie ne se recharge plus' }),
      makeAlert({ id: 'mineure', severity: 'mineure', title: 'Tore mal positionné' }),
    ];
    const health = deriveHealth(system, alerts, NOW);
    expect(health.status).toBe('en_panne');
    expect(health.reason).toBe('La batterie ne se recharge plus');
  });

  it('reports the oldest active grave alert as reason', () => {
    const system = makeSystem();
    const alerts: Alert[] = [
      makeAlert({ id: 'g1', since: '2026-09-24T11:00:00Z', title: 'Alerte récente' }),
      makeAlert({ id: 'g2', since: '2026-09-24T09:00:00Z', title: 'Alerte ancienne' }),
    ];
    const health = deriveHealth(system, alerts, NOW);
    expect(health.status).toBe('en_panne');
    expect(health.reason).toBe('Alerte ancienne');
    expect(health.since).toBe('2026-09-24T09:00:00Z');
  });

  it('is sans_nouvelles when the last measure is 12h01 old', () => {
    const system = makeSystem({ lastMeasureAt: '2026-09-24T00:59:00Z' });
    const health = deriveHealth(system, [], NOW);
    expect(health.status).toBe('sans_nouvelles');
    expect(health.reason).toBe('depuis 12 h');
    expect(health.since).toBe('2026-09-24T00:59:00Z');
  });

  it('is not sans_nouvelles when the last measure is 11h59 old', () => {
    const system = makeSystem({ lastMeasureAt: '2026-09-24T01:01:00Z' });
    const health = deriveHealth(system, [], NOW);
    expect(health.status).toBe('ok');
  });

  it('is sans_nouvelles when lastMeasureAt is null', () => {
    const system = makeSystem({ lastMeasureAt: null });
    const health = deriveHealth(system, [], NOW);
    expect(health.status).toBe('sans_nouvelles');
    expect(health.reason).toBe('Aucune donnée reçue');
    expect(health.since).toBeNull();
  });

  it('is ok with no reason when there is no alert and recent data', () => {
    const system = makeSystem();
    const health = deriveHealth(system, [], NOW);
    expect(health).toEqual({ status: 'ok', reason: null, since: null });
  });

  it('ignores a resolved grave alert', () => {
    const system = makeSystem();
    const alerts: Alert[] = [makeAlert({ resolvedAt: '2026-09-24T12:30:00Z' })];
    const health = deriveHealth(system, alerts, NOW);
    expect(health.status).toBe('ok');
  });

  it('ignores another system alert', () => {
    const system = makeSystem();
    const alerts: Alert[] = [makeAlert({ systemId: 'sys-2' })];
    const health = deriveHealth(system, alerts, NOW);
    expect(health.status).toBe('ok');
  });

  it('is a_surveiller when only a mineure alert is active, with its title as reason', () => {
    const system = makeSystem();
    const alerts: Alert[] = [makeAlert({ severity: 'mineure', title: 'Tore mal positionné' })];
    const health = deriveHealth(system, alerts, NOW);
    expect(health.status).toBe('a_surveiller');
    expect(health.reason).toBe('Tore mal positionné');
  });
});
