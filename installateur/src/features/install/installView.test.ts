import { describe, expect, it } from 'vitest';

import type { System } from '../../core/types';
import {
  missingContactFields,
  searchClients,
  showInvalidSerialHint,
  stepBackLabel,
  stepCta,
  stepHelp,
  stepLabel,
} from './installView';

function system(overrides: Partial<System> = {}): System {
  return {
    id: 'sys-petit',
    serial: 'RV-1000-0001',
    client: { name: 'Mme Petit', address: '14 rue Paul Bert, 69003 Lyon' },
    city: 'Lyon 3',
    batteryLabel: 'Revolty 10 kWh · 4 modules',
    pilotMode: 'autoconsommation',
    configuration: 'verifiee',
    lastMeasureAt: null,
    installedAt: '2026-01-01T00:00:00.000Z',
    isNew: false,
    ...overrides,
  };
}

describe('stepLabel', () => {
  it('names all 5 steps', () => {
    expect(stepLabel(1)).toBe('Étape 1 sur 5 · Batterie');
    expect(stepLabel(2)).toBe('Étape 2 sur 5 · Client');
    expect(stepLabel(3)).toBe('Étape 3 sur 5 · Mode de pilotage');
    expect(stepLabel(4)).toBe('Étape 4 sur 5 · Communication');
    expect(stepLabel(5)).toBe('Étape 5 sur 5 · Récapitulatif');
  });
});

describe('stepHelp', () => {
  it('gives a non-empty help line for every step', () => {
    for (let step = 1; step <= 5; step++) {
      expect(stepHelp(step).length).toBeGreaterThan(0);
    }
  });
});

describe('stepBackLabel', () => {
  it('is "Accueil" only on step 1', () => {
    expect(stepBackLabel(1)).toBe('Accueil');
    expect(stepBackLabel(2)).toBe('Étape précédente');
    expect(stepBackLabel(5)).toBe('Étape précédente');
  });
});

describe('stepCta', () => {
  it('is "Terminer" only on step 5', () => {
    expect(stepCta(1)).toBe('Continuer');
    expect(stepCta(4)).toBe('Continuer');
    expect(stepCta(5)).toBe('Terminer');
  });
});

describe('showInvalidSerialHint', () => {
  it('is hidden while empty', () => {
    expect(showInvalidSerialHint(null)).toBe(false);
    expect(showInvalidSerialHint('')).toBe(false);
    expect(showInvalidSerialHint('   ')).toBe(false);
  });

  it('shows for a partial or malformed serial', () => {
    expect(showInvalidSerialHint('RV-12')).toBe(true);
    expect(showInvalidSerialHint('not-a-serial')).toBe(true);
  });

  it('hides once the format is valid', () => {
    expect(showInvalidSerialHint('RV-2150-3321')).toBe(false);
    expect(showInvalidSerialHint('rv-2150-3321')).toBe(false);
  });
});

describe('searchClients', () => {
  const systems = [
    system({
      id: 'sys-petit',
      client: { name: 'Mme Petit', address: '14 rue Paul Bert, 69003 Lyon' },
      city: 'Lyon 3',
    }),
    system({
      id: 'sys-garnier',
      client: { name: 'M. Garnier', address: '8 avenue Franklin Roosevelt, 69500 Bron' },
      city: 'Bron',
    }),
  ];

  it('returns nothing for an empty query', () => {
    expect(searchClients(systems, '')).toEqual([]);
    expect(searchClients(systems, '   ')).toEqual([]);
  });

  it('matches by client name, accent and case insensitive', () => {
    expect(searchClients(systems, 'petit')).toMatchObject([
      { systemId: 'sys-petit', name: 'Mme Petit', city: 'Lyon 3' },
    ]);
    expect(searchClients(systems, 'PETIT')).toHaveLength(1);
  });

  it('matches by city', () => {
    expect(searchClients(systems, 'bron')).toMatchObject([{ systemId: 'sys-garnier' }]);
  });

  it('finds nothing when nothing matches', () => {
    expect(searchClients(systems, 'zzz')).toEqual([]);
  });
});

describe('missingContactFields', () => {
  it('lists phone and email only when empty', () => {
    expect(missingContactFields({ name: 'a', address: 'b', phone: '', email: '' })).toEqual([
      'phone',
      'email',
    ]);
    expect(
      missingContactFields({ name: 'a', address: 'b', phone: '0611223344', email: '' }),
    ).toEqual(['email']);
    expect(
      missingContactFields({ name: 'a', address: 'b', phone: '0611223344', email: 'a@b.fr' }),
    ).toEqual([]);
  });
});
