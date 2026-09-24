import { describe, expect, it } from 'vitest';

import { classifyGaps, dayVerdict, detectAnomalyStart } from '../core/energy';
import { generateMeasures } from '../core/measures';
import { buildPark } from '../core/park';
import { buildTodo } from '../core/todo';
import { DomainStateSchema } from '../core/types';
import {
  applyOutageScenario,
  bringAlertBack,
  createDemoState,
  DEMO_NOW_ISO,
  profileFor,
} from './fixtures';

const NOW = new Date(DEMO_NOW_ISO);

describe('demo fixtures', () => {
  it('pass the domain schema', () => {
    expect(DomainStateSchema.safeParse(createDemoState()).success).toBe(true);
  });

  it('return a fresh copy each time', () => {
    const a = createDemoState();
    a.systems.pop();
    expect(createDemoState().systems).toHaveLength(20);
  });

  it('give the park of the mockup (2 en panne, 1 sans nouvelles, 1 à surveiller, 16 OK)', () => {
    const state = createDemoState();
    const park = buildPark(state.systems, state.alerts, NOW);
    expect(park.counts).toEqual({ en_panne: 2, sans_nouvelles: 1, a_surveiller: 1, ok: 16 });
    expect(park.outage).toBeNull();
    expect(park.rows.slice(0, 4).map((r) => r.clientName)).toEqual([
      'Mme Petit',
      'M. Garnier',
      'M. Roux',
      'M. Durand',
    ]);
  });

  it('give the to-do list of the mockup, in order', () => {
    const todo = buildTodo(createDemoState(), NOW);
    expect(todo.cards.map((c) => `${c.verb} · ${c.clientName}`)).toEqual([
      'Remise en service · Mme Petit',
      'Remise en service · M. Garnier',
      'Changer un module · M. Bernard',
      'Vérifier le tore · M. Durand',
      'Rappeler le client · M. Roux',
    ]);
  });

  it('groups 7 Bron systems into one "Coupure probable" line in the outage scenario', () => {
    const state = applyOutageScenario(createDemoState());
    const park = buildPark(state.systems, state.alerts, NOW);
    expect(park.outage?.systemIds).toHaveLength(7);
    expect(park.outage?.rows.every((r) => r.city === 'Bron')).toBe(true);
    expect(park.counts.sans_nouvelles).toBe(8);
  });

  it('can bring a resolved alert back (demo of the reopening rule)', () => {
    const state = createDemoState();
    const resolved = {
      ...state,
      alerts: state.alerts.map((a) =>
        a.id === 'al-petit' ? { ...a, resolvedAt: '2026-09-24T13:01:00Z' } : a,
      ),
    };
    const back = bringAlertBack(resolved, 'sys-petit', new Date('2026-09-24T13:05:00Z'));
    const alert = back.alerts.find((a) => a.id === 'al-petit');
    expect(alert?.resolvedAt).toBeNull();
    expect(alert?.since).toBe('2026-09-24T13:05:00.000Z');
  });

  it('gives Mme Petit a broken battery since Monday 21 and M. Roux a silence since 01:00', () => {
    const state = createDemoState();
    const petit = state.systems.find((s) => s.id === 'sys-petit');
    const roux = state.systems.find((s) => s.id === 'sys-roux');
    expect(petit && profileFor(petit).brokenFrom).toBe('2026-09-21T04:00:00Z');
    expect(roux && profileFor(roux).silentFrom).toBe('2026-09-23T23:15:00Z');
  });

  it('builds a default profile for a system created during the demo', () => {
    const state = createDemoState();
    const base = state.systems[0];
    if (base === undefined) throw new Error('no system');
    const profile = profileFor({ ...base, id: 'sys-new', serial: 'RV-9999-0001' });
    expect(profile).toEqual({
      systemId: 'sys-new',
      seed: 'RV-9999-0001',
      pilotMode: base.pilotMode,
    });
  });

  it('drive the data-screen verdicts of the mockup', () => {
    const state = createDemoState();
    const byId = (id: string) => {
      const s = state.systems.find((x) => x.id === id);
      if (s === undefined) throw new Error(id);
      return generateMeasures(profileFor(s), '2026-08-25', DEMO_NOW_ISO);
    };
    const petit = byId('sys-petit');
    expect(dayVerdict(petit, '2026-09-23', 'autoconsommation').kind).toBe('anormal');
    expect(dayVerdict(petit, '2026-09-20', 'autoconsommation').kind).toBe('normal');
    expect(detectAnomalyStart(petit, '2026-09-23', 'autoconsommation')).toBe('2026-09-21');
    expect(dayVerdict(byId('sys-lefevre'), '2026-09-23', 'heures_creuses').kind).toBe('normal');
    const gaps = classifyGaps(byId('sys-roux'), '2026-09-23T23:00:00Z');
    expect(gaps.at(-1)?.kind).toBe('attente');
  });
});
