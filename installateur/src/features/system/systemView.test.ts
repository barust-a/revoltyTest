import { describe, expect, it } from 'vitest';

import type { Alert, Manip } from '../../core/types';
import {
  firstAlertWithoutOpenManip,
  lowerFirst,
  ongoingManipsFor,
  openManipForAlert,
  resolvedAlertsFor,
  verdictCardLines,
} from './systemView';

function alert(overrides: Partial<Alert> & Pick<Alert, 'id' | 'severity'>): Alert {
  return {
    systemId: 'sys-a',
    title: 'Problème',
    clientImpact: 'Impact',
    checks: [],
    manipType: 'remise_en_service',
    since: '2026-09-21T12:00:00Z',
    resolvedAt: null,
    ...overrides,
  };
}

function manip(overrides: Partial<Manip> & Pick<Manip, 'id' | 'status'>): Manip {
  return {
    systemId: 'sys-a',
    type: 'remise_en_service',
    origin: 'alerte',
    alertId: null,
    createdAt: '2026-09-21T12:00:00Z',
    dueAt: null,
    openedByInstaller: false,
    reopened: false,
    transmitted: false,
    confirmBy: null,
    attempts: [],
    ...overrides,
  };
}

describe('openManipForAlert', () => {
  it('finds the manip still linked to the alert, ignoring closed ones', () => {
    const manips = [
      manip({ id: 'm1', alertId: 'al-1', status: 'cloturee' }),
      manip({ id: 'm2', alertId: 'al-1', status: 'a_faire' }),
    ];
    expect(openManipForAlert('al-1', manips)?.id).toBe('m2');
    expect(openManipForAlert('al-2', manips)).toBeNull();
  });
});

describe('firstAlertWithoutOpenManip', () => {
  it('returns the first active alert that has no open manip yet', () => {
    const alerts = [
      alert({ id: 'al-1', severity: 'grave' }),
      alert({ id: 'al-2', severity: 'mineure' }),
    ];
    const manips = [manip({ id: 'm1', alertId: 'al-1', status: 'a_faire' })];
    expect(firstAlertWithoutOpenManip('sys-a', alerts, manips)?.id).toBe('al-2');
  });

  it('returns null when every active alert already has an open manip', () => {
    const alerts = [alert({ id: 'al-1', severity: 'grave' })];
    const manips = [manip({ id: 'm1', alertId: 'al-1', status: 'a_faire' })];
    expect(firstAlertWithoutOpenManip('sys-a', alerts, manips)).toBeNull();
  });
});

describe('resolvedAlertsFor', () => {
  it('keeps only resolved alerts for the system, most recent first', () => {
    const alerts = [
      alert({ id: 'al-1', severity: 'grave', resolvedAt: '2026-09-20T00:00:00Z' }),
      alert({ id: 'al-2', severity: 'grave', resolvedAt: '2026-09-22T00:00:00Z' }),
      alert({ id: 'al-3', severity: 'grave', resolvedAt: null }),
    ];
    expect(resolvedAlertsFor('sys-a', alerts).map((a) => a.id)).toEqual(['al-2', 'al-1']);
  });
});

describe('ongoingManipsFor', () => {
  it('includes open manips and those awaiting battery confirmation, sorted by due date', () => {
    const manips = [
      manip({ id: 'm1', status: 'a_faire', dueAt: '2026-09-25T16:00:00Z' }),
      manip({ id: 'm2', status: 'attente_confirmation', dueAt: null }),
      manip({ id: 'm3', status: 'a_faire', dueAt: '2026-09-24T16:00:00Z' }),
      manip({ id: 'm4', status: 'cloturee', dueAt: '2026-09-01T16:00:00Z' }),
    ];
    expect(ongoingManipsFor('sys-a', manips).map((m) => m.id)).toEqual(['m3', 'm1', 'm2']);
  });
});

describe('lowerFirst', () => {
  it('lowercases only the first character', () => {
    expect(lowerFirst('La batterie a travaillé normalement')).toBe(
      'la batterie a travaillé normalement',
    );
  });
});

describe('verdictCardLines', () => {
  it('leads with "Anormal depuis" for an abnormal day', () => {
    const lines = verdictCardLines({
      kind: 'anormal',
      title: 'La batterie ne se charge plus alors que les panneaux produisent',
      detail: '',
      dayKey: '2026-09-23',
      anomalyStartDayLabel: 'lun. 21 sept.',
    });
    expect(lines.primary).toBe('Anormal depuis lun. 21 sept.');
    expect(lines.secondary).toBe('La batterie ne se charge plus alors que les panneaux produisent');
  });

  it('phrases a normal day as "Hier : ... ✓"', () => {
    const lines = verdictCardLines({
      kind: 'normal',
      title: 'La batterie a travaillé normalement',
      detail: 'Chargée en journée avec le surplus, déchargée le soir.',
      dayKey: '2026-09-23',
      anomalyStartDayLabel: null,
    });
    expect(lines.primary).toBe('Hier : la batterie a travaillé normalement ✓');
  });
});
