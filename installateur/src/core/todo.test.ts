import { describe, expect, it } from 'vitest';

import type { Alert, Closure, DomainState, Manip, QueueItem } from './types';
import { buildTodo, isOpenTodo, sortTodo, urgencyReason } from './todo';

const NOW = new Date('2026-09-24T13:00:00Z'); // jeu. 24 sept., 15:00 à Lyon

function makeManip(overrides: Partial<Manip> = {}): Manip {
  return {
    id: 'mp-1',
    systemId: 'sys-1',
    type: 'verifier_tore',
    origin: 'alerte',
    alertId: null,
    createdAt: '2026-09-24T09:00:00Z',
    dueAt: '2026-09-24T18:00:00Z',
    openedByInstaller: false,
    status: 'a_faire',
    reopened: false,
    transmitted: false,
    confirmBy: null,
    attempts: [],
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
    since: '2026-09-24T08:00:00Z',
    resolvedAt: null,
    ...overrides,
  };
}

function makeClosure(overrides: Partial<Closure> = {}): Closure {
  return {
    id: 'cl-1',
    manipId: 'mp-1',
    result: 'pas_resolu',
    actions: [],
    photos: [],
    arrivedAt: '2026-09-24T09:00:00Z',
    closedAt: '2026-09-24T09:30:00Z',
    ...overrides,
  };
}

describe('isOpenTodo', () => {
  it('treats a_faire and a_confirmer as open', () => {
    expect(isOpenTodo(makeManip({ status: 'a_faire' }))).toBe(true);
    expect(isOpenTodo(makeManip({ status: 'a_confirmer' }))).toBe(true);
  });

  it('excludes cloturee and attente_confirmation', () => {
    expect(isOpenTodo(makeManip({ status: 'cloturee' }))).toBe(false);
    expect(isOpenTodo(makeManip({ status: 'attente_confirmation' }))).toBe(false);
  });
});

describe('urgencyReason', () => {
  it('is alerte when linked to an active grave alert', () => {
    const manip = makeManip({ alertId: 'al-1', dueAt: '2026-09-25T18:00:00Z' });
    const alerts = [makeAlert({ id: 'al-1', severity: 'grave', resolvedAt: null })];
    expect(urgencyReason(manip, alerts, NOW)).toBe('alerte');
  });

  it('is retard when due one minute in the past', () => {
    const manip = makeManip({ alertId: null, dueAt: '2026-09-24T12:59:00Z' });
    expect(urgencyReason(manip, [], NOW)).toBe('retard');
  });

  it('is null when linked alert is resolved and due date is in the future', () => {
    const manip = makeManip({ alertId: 'al-1', dueAt: '2026-09-25T18:00:00Z' });
    const alerts = [
      makeAlert({ id: 'al-1', severity: 'grave', resolvedAt: '2026-09-24T10:00:00Z' }),
    ];
    expect(urgencyReason(manip, alerts, NOW)).toBeNull();
  });
});

describe('sortTodo', () => {
  it('sorts urgent first, then by due date ascending, stably, with null due last', () => {
    const urgentLate = makeManip({ id: 'a', alertId: null, dueAt: '2026-09-24T12:00:00Z' }); // retard
    const notUrgentSoon = makeManip({ id: 'b', alertId: null, dueAt: '2026-09-24T14:00:00Z' });
    const notUrgentNull = makeManip({ id: 'c', alertId: null, dueAt: null });
    const notUrgentLater = makeManip({ id: 'd', alertId: null, dueAt: '2026-09-25T14:00:00Z' });
    const tieA = makeManip({ id: 'e', alertId: null, dueAt: '2026-09-24T14:00:00Z' });

    const sorted = sortTodo(
      [notUrgentNull, notUrgentLater, urgentLate, notUrgentSoon, tieA],
      [],
      NOW,
    );
    expect(sorted.map((m) => m.id)).toEqual(['a', 'b', 'e', 'd', 'c']);
  });

  it('puts urgent-via-alert before urgent-because-late, whatever the due dates', () => {
    const alert = makeAlert({ id: 'al', severity: 'grave', resolvedAt: null });
    const late = makeManip({ id: 'late', alertId: null, dueAt: '2026-09-22T16:00:00Z' });
    const viaAlert = makeManip({ id: 'alert', alertId: 'al', dueAt: '2026-09-25T16:00:00Z' });
    expect(sortTodo([late, viaAlert], [alert], NOW).map((m) => m.id)).toEqual(['alert', 'late']);
  });

  it('keeps only open todos', () => {
    const open = makeManip({ id: 'open', status: 'a_faire' });
    const closed = makeManip({ id: 'closed', status: 'cloturee' });
    expect(sortTodo([open, closed], [], NOW).map((m) => m.id)).toEqual(['open']);
  });
});

describe('buildTodo', () => {
  function stateWith(manips: Manip[], extra: Partial<DomainState> = {}): DomainState {
    return {
      systems: [
        {
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
        },
      ],
      alerts: [],
      manips,
      queue: [],
      ...extra,
    };
  }

  it('caps cards at the limit and reports hiddenCount', () => {
    const manips = Array.from({ length: 7 }, (_, i) =>
      makeManip({ id: `mp-${i}`, dueAt: `2026-09-24T${14 + i}:00:00Z` }),
    );
    const { cards, hiddenCount, total } = buildTodo(stateWith(manips), NOW);
    expect(cards).toHaveLength(5);
    expect(hiddenCount).toBe(2);
    expect(total).toBe(7);
  });

  it('labels urgency like the mockup (via alerte / N j de retard) and shows the planned day when late', () => {
    const alert = makeAlert({ id: 'al', severity: 'grave', resolvedAt: null });
    const viaAlert = makeManip({ id: 'mp-a', alertId: 'al', dueAt: '2026-09-24T16:00:00Z' });
    const late = makeManip({ id: 'mp-l', alertId: null, dueAt: '2026-09-22T16:00:00Z' });
    const calm = makeManip({ id: 'mp-c', alertId: null, dueAt: '2026-10-01T16:00:00Z' });
    const { cards } = buildTodo(stateWith([calm, late, viaAlert], { alerts: [alert] }), NOW);
    expect(cards.map((c) => [c.urgencyLabel, c.due])).toEqual([
      ['Urgent · via alerte', "Aujourd'hui"],
      ['Urgent · 2 j de retard', 'Prévu mar. 22 sept.'],
      [null, 'jeu. 1er oct.'],
    ]);
  });

  it('skips manips whose system no longer exists', () => {
    const manips = [makeManip({ id: 'mp-1', systemId: 'ghost' })];
    const { cards, total } = buildTodo(stateWith(manips), NOW);
    expect(cards).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('excludes cloturee and attente_confirmation manips', () => {
    const manips = [
      makeManip({ id: 'mp-1', status: 'cloturee' }),
      makeManip({ id: 'mp-2', status: 'attente_confirmation' }),
    ];
    const { cards, total } = buildTodo(stateWith(manips), NOW);
    expect(cards).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('adds a mention for the second attempt', () => {
    const manip = makeManip({
      id: 'mp-1',
      attempts: [makeClosure({ id: 'cl-1', result: 'pas_resolu' })],
    });
    const { cards } = buildTodo(stateWith([manip]), NOW);
    expect(cards[0]?.mentions).toContain('2ᵉ passage');
  });

  it('adds a mention when transmitted to Revolty', () => {
    const manip = makeManip({ id: 'mp-1', transmitted: true });
    const { cards } = buildTodo(stateWith([manip]), NOW);
    expect(cards[0]?.mentions).toContain('Transmise à Revolty');
  });

  it('adds a mention when a_confirmer, resolved on its own', () => {
    const manip = makeManip({ id: 'mp-1', status: 'a_confirmer' });
    const { cards } = buildTodo(stateWith([manip]), NOW);
    expect(cards[0]?.mentions).toContain('Résolu tout seul · à confirmer');
  });

  it('adds a mention when reopened', () => {
    const manip = makeManip({ id: 'mp-1', reopened: true });
    const { cards } = buildTodo(stateWith([manip]), NOW);
    expect(cards[0]?.mentions).toContain('Rouverte · le problème est revenu');
  });

  it('picks sync from the queue item matching the last attempt', () => {
    const manip = makeManip({
      id: 'mp-1',
      attempts: [makeClosure({ id: 'cl-1' }), makeClosure({ id: 'cl-2' })],
    });
    const queue: QueueItem[] = [
      {
        id: 'q-1',
        kind: 'cloture',
        refId: 'cl-2',
        systemId: 'sys-1',
        label: 'Clôture',
        sync: 'envoi',
        createdAt: '2026-09-24T09:30:00Z',
      },
    ];
    const { cards } = buildTodo(stateWith([manip], { queue }), NOW);
    expect(cards[0]?.sync).toBe('envoi');
  });

  it('has null sync when there is no matching queue item', () => {
    const manip = makeManip({ id: 'mp-1', attempts: [] });
    const { cards } = buildTodo(stateWith([manip]), NOW);
    expect(cards[0]?.sync).toBeNull();
  });
});
