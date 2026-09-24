import { describe, expect, it } from 'vitest';

import {
  canAdvance,
  cityFromAddress,
  completeInstallation,
  emptyDraft,
  InstallDraftSchema,
  type InstallDraft,
} from './install';
import type { DomainState } from './types';

const NOW = new Date('2026-09-24T13:00:00Z');
const EMPTY_STATE: DomainState = { systems: [], alerts: [], manips: [], queue: [] };

function draft(overrides: Partial<InstallDraft> = {}): InstallDraft {
  return {
    ...emptyDraft(),
    serial: 'RV-2150-3321',
    client: { name: 'M. Blanc', address: '10 rue Garibaldi, 69006 Lyon', phone: '', email: '' },
    comm: 'ok',
    commSocPct: 54,
    ...overrides,
  };
}

describe('install draft', () => {
  it('starts empty on step 1 with autoconsommation pre-selected', () => {
    const d = emptyDraft();
    expect(d.step).toBe(1);
    expect(d.pilotMode).toBe('autoconsommation');
    expect(InstallDraftSchema.safeParse(d).success).toBe(true);
  });

  it('requires a valid serial to leave step 1', () => {
    expect(canAdvance({ ...emptyDraft(), step: 1 })).toBe(false);
    expect(canAdvance({ ...emptyDraft(), step: 1, serial: 'RV-2150-3321' })).toBe(true);
  });

  it('requires a client name and address to leave step 2, email optional but valid', () => {
    const base = draft({ step: 2 });
    expect(canAdvance(base)).toBe(true);
    expect(canAdvance({ ...base, client: { ...base.client, name: '  ' } })).toBe(false);
    expect(canAdvance({ ...base, client: { ...base.client, address: '' } })).toBe(false);
    expect(canAdvance({ ...base, client: { ...base.client, email: 'pas-un-mail' } })).toBe(false);
    expect(canAdvance({ ...base, client: { ...base.client, email: 'blanc@example.fr' } })).toBe(
      true,
    );
  });

  it('needs the communication test to be done or skipped to leave step 4', () => {
    expect(canAdvance(draft({ step: 4, comm: null }))).toBe(false);
    expect(canAdvance(draft({ step: 4, comm: 'skipped' }))).toBe(true);
  });
});

describe('cityFromAddress', () => {
  it('takes what follows the postal code', () => {
    expect(cityFromAddress('10 rue Garibaldi, 69006 Lyon')).toBe('Lyon');
    expect(cityFromAddress('3 chemin de Vassieux, 69300 Caluire-et-Cuire')).toBe(
      'Caluire-et-Cuire',
    );
  });

  it('falls back to the last comma part', () => {
    expect(cityFromAddress('Le Bourg, Pollionnay')).toBe('Pollionnay');
  });
});

describe('completeInstallation', () => {
  it('creates a verified new system when communication works', () => {
    const { state, systemId } = completeInstallation(EMPTY_STATE, draft(), NOW);
    const system = state.systems[0];
    expect(systemId).toBe(system?.id);
    expect(system).toMatchObject({
      serial: 'RV-2150-3321',
      city: 'Lyon',
      configuration: 'verifiee',
      lastMeasureAt: NOW.toISOString(),
      isNew: true,
      client: { name: 'M. Blanc', address: '10 rue Garibaldi, 69006 Lyon' },
    });
    expect(system?.client).not.toHaveProperty('email');
    expect(state.manips).toHaveLength(0);
    expect(state.queue[0]).toMatchObject({
      kind: 'installation',
      label: 'Installation · M. Blanc',
      sync: 'en_attente',
    });
  });

  it('creates an unverified system and a "Vérifier la communication" manip when the test was skipped', () => {
    const { state } = completeInstallation(EMPTY_STATE, draft({ comm: 'skipped' }), NOW);
    expect(state.systems[0]).toMatchObject({ configuration: 'non_verifiee', lastMeasureAt: null });
    expect(state.manips[0]).toMatchObject({
      type: 'verifier_communication',
      origin: 'installation',
      dueAt: '2026-09-25T16:00:00.000Z',
      status: 'a_faire',
    });
  });

  it('clears the "new" badge of previously created systems', () => {
    const first = completeInstallation(EMPTY_STATE, draft(), NOW).state;
    const second = completeInstallation(first, draft({ serial: 'RV-2150-3322' }), NOW).state;
    expect(second.systems.map((s) => s.isNew)).toEqual([false, true]);
  });

  it('keeps the email when given', () => {
    const d = draft();
    const { state } = completeInstallation(
      EMPTY_STATE,
      { ...d, client: { ...d.client, email: 'blanc@example.fr', phone: '0611223344' } },
      NOW,
    );
    expect(state.systems[0]?.client).toMatchObject({
      email: 'blanc@example.fr',
      phone: '0611223344',
    });
  });
});
