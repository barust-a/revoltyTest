import { describe, expect, it } from 'vitest';

import {
  AlertSchema,
  ClosureSchema,
  DomainStateSchema,
  ManipSchema,
  MeasureSchema,
  SystemSchema,
} from './types';

const system = {
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

const alert = {
  id: 'al-petit',
  systemId: 'sys-petit',
  severity: 'grave',
  title: 'La batterie ne se recharge plus',
  clientImpact: 'Plus de secours en cas de coupure, sa facture remonte',
  checks: ['Disjoncteur batterie'],
  manipType: 'remise_en_service',
  since: '2026-09-21T12:00:00Z',
  resolvedAt: null,
};

const closure = {
  id: 'mp-petit-1',
  manipId: 'mp-petit',
  result: 'pas_resolu',
  next: 'repasser',
  actions: ['Disjoncteur réarmé'],
  photos: [],
  arrivedAt: '2026-09-24T12:30:00Z',
  closedAt: '2026-09-24T12:50:00Z',
};

const manip = {
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
  attempts: [closure],
};

const measure = {
  systemId: 'sys-petit',
  at: '2026-09-24T12:45:00Z',
  productionW: 3200,
  consumptionW: 800,
  batteryW: null,
  gridW: -2400,
  socPct: 8,
};

describe('domain schemas', () => {
  it('accepts valid objects', () => {
    expect(SystemSchema.safeParse(system).success).toBe(true);
    expect(AlertSchema.safeParse(alert).success).toBe(true);
    expect(ClosureSchema.safeParse(closure).success).toBe(true);
    expect(ManipSchema.safeParse(manip).success).toBe(true);
    expect(MeasureSchema.safeParse(measure).success).toBe(true);
  });

  it('rejects a malformed serial', () => {
    expect(SystemSchema.safeParse({ ...system, serial: 'rv-12' }).success).toBe(false);
  });

  it('rejects an empty client name or address', () => {
    expect(SystemSchema.safeParse({ ...system, client: { name: '', address: 'x' } }).success).toBe(
      false,
    );
  });

  it('rejects a state of charge above 100 %', () => {
    expect(MeasureSchema.safeParse({ ...measure, socPct: 101 }).success).toBe(false);
  });

  it('rejects more than two photos', () => {
    expect(ClosureSchema.safeParse({ ...closure, photos: ['a', 'b', 'c'] }).success).toBe(false);
  });

  it('validates a whole domain state', () => {
    const state = {
      systems: [system],
      alerts: [alert],
      manips: [manip],
      queue: [
        {
          id: 'q1',
          kind: 'cloture',
          refId: 'mp-petit-1',
          systemId: 'sys-petit',
          label: 'Clôture · Mme Petit',
          sync: 'en_attente',
          createdAt: '2026-09-24T12:50:00Z',
        },
      ],
    };
    expect(DomainStateSchema.safeParse(state).success).toBe(true);
  });
});
