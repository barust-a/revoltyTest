import { describe, expect, it } from 'vitest';

import type { Health } from './health';
import type { Alert, HealthStatus, System } from './types';
import { buildPark, filterRows, groupOutages, sortPark } from './park';
import type { ParkRow } from './park';

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

function healthOf(status: HealthStatus, since: string | null = null): Health {
  return { status, reason: status === 'ok' ? null : 'reason', since };
}

function makeRow(overrides: Partial<ParkRow> = {}): ParkRow {
  return {
    systemId: 'sys-1',
    clientName: 'Mme Lefèvre',
    city: 'Bron',
    serial: 'RV-1234-5678',
    health: healthOf('ok'),
    isNew: false,
    ...overrides,
  };
}

describe('groupOutages', () => {
  it('does not group 4 sans_nouvelles systems within the hour', () => {
    const rows = [0, 12, 24, 36].map((min) =>
      makeRow({
        systemId: `sys-${min}`,
        health: healthOf('sans_nouvelles', `2026-09-24T10:${String(min).padStart(2, '0')}:00Z`),
      }),
    );
    const { outage, rest } = groupOutages(rows);
    expect(outage).toBeNull();
    expect(rest).toEqual(rows);
  });

  it('groups 5 sans_nouvelles systems within the hour', () => {
    const clustered = [0, 12, 24, 36, 48].map((min) =>
      makeRow({
        systemId: `sys-${min}`,
        clientName: `Client ${String.fromCharCode(90 - min / 12)}`,
        health: healthOf('sans_nouvelles', `2026-09-24T10:${String(min).padStart(2, '0')}:00Z`),
      }),
    );
    const okRow = makeRow({ systemId: 'sys-ok', health: healthOf('ok') });
    const rows = [...clustered, okRow];

    const { outage, rest } = groupOutages(rows);
    expect(outage).not.toBeNull();
    expect(outage?.since).toBe('2026-09-24T10:00:00Z');
    expect(outage?.systemIds.sort()).toEqual(clustered.map((r) => r.systemId).sort());
    expect(outage?.rows.map((r) => r.clientName)).toEqual(
      [...outage!.rows].map((r) => r.clientName).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    );
    expect(rest).toEqual([okRow]);
  });

  it('does not group 5 sans_nouvelles systems spread over 3 hours', () => {
    const rows = ['08:00', '09:15', '10:30', '11:45', '13:00'].map((t) =>
      makeRow({
        systemId: `sys-${t}`,
        health: healthOf('sans_nouvelles', `2026-09-24T${t}:00Z`),
      }),
    );
    const { outage, rest } = groupOutages(rows);
    expect(outage).toBeNull();
    expect(rest).toEqual(rows);
  });
});

describe('sortPark', () => {
  it('sorts isNew first, then by health rank, then by client name, stably', () => {
    const a = makeRow({ systemId: 'a', clientName: 'Bernard', health: healthOf('ok') });
    const b = makeRow({ systemId: 'b', clientName: 'Albert', health: healthOf('ok') });
    const c = makeRow({ systemId: 'c', clientName: 'Zoé', health: healthOf('en_panne') });
    const d = makeRow({ systemId: 'd', clientName: 'Aline', health: healthOf('sans_nouvelles') });
    const e = makeRow({ systemId: 'e', clientName: 'Yves', isNew: true, health: healthOf('ok') });
    const f = makeRow({
      systemId: 'f',
      clientName: 'Adrien',
      isNew: true,
      health: healthOf('a_surveiller'),
    });

    expect(sortPark([a, b, c, d, e, f]).map((r) => r.systemId)).toEqual([
      'f',
      'e',
      'c',
      'd',
      'b',
      'a',
    ]);
  });
});

describe('sortPark tie-break', () => {
  it('puts the oldest problem first within the same health status', () => {
    const recent = makeRow({
      systemId: 'recent',
      clientName: 'Albert',
      health: { status: 'en_panne', reason: 'x', since: '2026-09-23T15:00:00Z' },
    });
    const old = makeRow({
      systemId: 'old',
      clientName: 'Zoé',
      health: { status: 'en_panne', reason: 'x', since: '2026-09-21T12:00:00Z' },
    });
    expect(sortPark([recent, old]).map((r) => r.systemId)).toEqual(['old', 'recent']);
  });
});

describe('buildPark', () => {
  it('computes counts over all systems and rows without the outage group', () => {
    const systems: System[] = [
      makeSystem({
        id: 's1',
        client: { name: 'Bernard', address: 'x' },
        lastMeasureAt: NOW.toISOString(),
      }),
      makeSystem({ id: 's2', client: { name: 'Albert', address: 'x' }, lastMeasureAt: null }),
    ];
    const alerts: Alert[] = [];
    const view = buildPark(systems, alerts, NOW);
    expect(view.total).toBe(2);
    expect(view.counts.ok).toBe(1);
    expect(view.counts.sans_nouvelles).toBe(1);
    expect(view.allOk).toBe(false);
    expect(view.rows.map((r) => r.systemId)).toEqual(['s2', 's1']);
  });
});

describe('filterRows', () => {
  const rows: ParkRow[] = [
    makeRow({ systemId: 's1', clientName: 'Mme Lefèvre', city: 'Bron', serial: 'RV-2031-0001' }),
    makeRow({ systemId: 's2', clientName: 'M. Dupont', city: 'Lyon', serial: 'RV-1111-2222' }),
  ];

  it('matches by city, case- and accent-insensitive', () => {
    expect(filterRows(rows, 'bron', null).map((r) => r.systemId)).toEqual(['s1']);
  });

  it('matches by client name ignoring accents', () => {
    expect(filterRows(rows, 'lefevre', null).map((r) => r.systemId)).toEqual(['s1']);
  });

  it('matches by serial', () => {
    expect(filterRows(rows, 'RV-2031', null).map((r) => r.systemId)).toEqual(['s1']);
  });

  it('filters by status', () => {
    const withStatus = [
      makeRow({ systemId: 's1', health: healthOf('ok') }),
      makeRow({ systemId: 's2', health: healthOf('en_panne') }),
    ];
    expect(filterRows(withStatus, '', 'en_panne').map((r) => r.systemId)).toEqual(['s2']);
  });
});
