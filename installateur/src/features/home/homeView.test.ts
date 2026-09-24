import { describe, expect, it } from 'vitest';

import { createDemoState } from '../../adapters/fixtures';
import { buildPark } from '../../core/park';
import { buildTodo } from '../../core/todo';
import type { DomainState, QueueItem } from '../../core/types';
import {
  buildConnectionView,
  buildHealthTiles,
  buildParkList,
  dueVisual,
  filterBadgeLabel,
  formatFullDate,
  isAwaitingConfirmation,
  okGroupLabel,
  outageDetail,
  outageTitle,
  plural,
  syncItemFor,
  urgencyIcon,
} from './homeView';

const NOW = new Date('2026-09-24T13:00:00Z'); // jeu. 24 sept., 15:00 à Lyon

describe('formatFullDate', () => {
  it('spells the day and month out in full, no Intl', () => {
    expect(formatFullDate(NOW)).toBe('Jeudi 24 septembre');
  });
});

describe('plural', () => {
  it('picks the singular form at 0 and 1, the plural form above', () => {
    expect(plural(0, 'système', 'systèmes')).toBe('0 système');
    expect(plural(1, 'système', 'systèmes')).toBe('1 système');
    expect(plural(2, 'système', 'systèmes')).toBe('2 systèmes');
  });
});

describe('buildConnectionView', () => {
  const queue: QueueItem[] = [
    {
      id: 'q1',
      kind: 'cloture',
      refId: 'c1',
      systemId: 'sys-1',
      label: 'Remise en service',
      sync: 'en_attente',
      createdAt: NOW.toISOString(),
    },
    {
      id: 'q2',
      kind: 'cloture',
      refId: 'c2',
      systemId: 'sys-2',
      label: 'Vérifier le tore',
      sync: 'echec',
      createdAt: NOW.toISOString(),
    },
  ];

  it('online: "à jour à HH:MM" plus a pending count', () => {
    const view = buildConnectionView(false, '2026-09-24T12:58:00Z', queue);
    expect(view.label).toBe('En ligne · à jour à 14:58');
    expect(view.pendingLabel).toBe('2 envois en attente');
    expect(view.failedLabel).toBe('1 envoi en échec');
  });

  it('offline: "données de HH:MM" plus pending closures', () => {
    const view = buildConnectionView(true, '2026-09-24T13:00:00Z', queue);
    expect(view.label).toBe('Hors ligne · données de 15:00');
    expect(view.pendingLabel).toBe("2 clôtures en attente d'envoi");
  });
});

describe('buildHealthTiles', () => {
  it('hides a status whose count is 0', () => {
    const tiles = buildHealthTiles({ en_panne: 2, sans_nouvelles: 0, a_surveiller: 1, ok: 16 });
    expect(tiles.map((t) => t.status)).toEqual(['en_panne', 'a_surveiller', 'ok']);
  });
});

describe('filterBadgeLabel', () => {
  it('names the active filter', () => {
    expect(filterBadgeLabel('en_panne')).toBe('Filtre : En panne · Tout afficher');
  });
});

describe('urgencyIcon / dueVisual', () => {
  it('picks an alert icon for "alerte" urgency', () => {
    expect(urgencyIcon('alerte')).toBe('error');
    expect(urgencyIcon('retard')).toBe('schedule');
  });

  it('flags a "retard" due date as late', () => {
    expect(dueVisual('retard')).toEqual({ icon: 'event-busy', late: true });
    expect(dueVisual('alerte')).toEqual({ icon: 'event', late: false });
    expect(dueVisual(null)).toEqual({ icon: 'event', late: false });
  });
});

describe('demo-data scenarios', () => {
  const domain: DomainState = createDemoState();

  it('buildParkList: outage group + its "depuis 02:05" detail after triggerOutage', () => {
    const outaged: DomainState = {
      ...domain,
      systems: domain.systems.map((s) => {
        const at: Record<string, string> = {
          'sys-faure': '2026-09-24T00:05:00Z',
          'sys-girard': '2026-09-24T00:10:00Z',
          'sys-lambert': '2026-09-24T00:15:00Z',
          'sys-bonnet': '2026-09-24T00:20:00Z',
          'sys-chevalier': '2026-09-24T00:30:00Z',
          'sys-robin': '2026-09-24T00:40:00Z',
          'sys-masson': '2026-09-24T00:50:00Z',
        };
        const lastMeasureAt = at[s.id];
        return lastMeasureAt === undefined ? s : { ...s, lastMeasureAt };
      }),
    };
    const park = buildPark(outaged.systems, outaged.alerts, NOW);
    expect(park.outage).not.toBeNull();
    const list = buildParkList(park, '', null, false, false);
    const outageItem = list.find((i) => i.kind === 'outage');
    expect(outageItem).toBeDefined();
    if (outageItem?.kind === 'outage') {
      expect(outageTitle(outageItem.group)).toBe('Coupure probable · Bron');
      expect(outageDetail(outageItem.group)).toBe('7 systèmes sans nouvelles depuis 02:05');
    }
  });

  it('buildParkList: search "bron" surfaces M. Garnier and hides Mme Petit', () => {
    const park = buildPark(domain.systems, domain.alerts, NOW);
    const list = buildParkList(park, 'bron', null, false, false);
    const names = list
      .filter((i) => i.kind === 'row')
      .map((i) => (i.kind === 'row' ? i.row.clientName : ''));
    expect(names).toContain('M. Garnier');
    expect(names).not.toContain('Mme Petit');
  });

  it('okGroupLabel matches the demo park total', () => {
    const park = buildPark(domain.systems, domain.alerts, NOW);
    expect(okGroupLabel(park.counts.ok)).toBe('16 systèmes OK');
  });

  it('buildTodo order: Mme Petit, M. Garnier, then M. Bernard', () => {
    const { cards } = buildTodo(domain, NOW);
    expect(cards.map((c) => c.clientName)).toEqual([
      'Mme Petit',
      'M. Garnier',
      'M. Bernard',
      'M. Durand',
      'M. Roux',
    ]);
    expect(cards[0]?.urgencyLabel).toBe('Urgent · via alerte');
    expect(cards[2]?.urgencyLabel).toBe('Urgent · 2 j de retard');
  });

  it('syncItemFor / isAwaitingConfirmation: null/false when nothing was ever attempted', () => {
    expect(syncItemFor(domain, 'mp-petit')).toBeNull();
    expect(isAwaitingConfirmation(domain, 'mp-petit')).toBe(false);
  });
});
