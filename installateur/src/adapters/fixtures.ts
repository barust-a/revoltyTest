import type { MeasureProfile } from '../core/measures';
import type { Alert, DomainState, Manip, System } from '../core/types';

// Demo data (spec §3.7): Karim's 20 systems around Lyon, frozen at DEMO_NOW.
// All dates are UTC; Lyon is UTC+2 in September (15:00 local = 13:00Z).

export const DEMO_NOW_ISO = '2026-09-24T13:00:00Z';
export const INSTALLER_NAME = 'Karim';

type SystemSeed = {
  id: string;
  name: string;
  address: string;
  city: string;
  serial: string;
  kwh: 5 | 10 | 15;
  lastMeasureAt?: string | null;
  pilotMode?: System['pilotMode'];
  phone?: string;
};

const MODULES = { 5: 2, 10: 4, 15: 6 } as const;

const SEEDS: SystemSeed[] = [
  {
    id: 'sys-petit',
    name: 'Mme Petit',
    address: '14 rue Paul Bert, 69003 Lyon',
    city: 'Lyon 3',
    serial: 'RV-2031-4410',
    kwh: 10,
    lastMeasureAt: '2026-09-24T12:48:00Z',
    phone: '06 12 34 56 78',
  },
  {
    id: 'sys-garnier',
    name: 'M. Garnier',
    address: '8 avenue Franklin Roosevelt, 69500 Bron',
    city: 'Bron',
    serial: 'RV-2044-1187',
    kwh: 10,
    phone: '06 23 45 67 89',
  },
  {
    id: 'sys-durand',
    name: 'M. Durand',
    address: '3 chemin de Vassieux, 69300 Caluire',
    city: 'Caluire',
    serial: 'RV-1987-3021',
    kwh: 15,
    phone: '06 34 56 78 90',
  },
  {
    id: 'sys-roux',
    name: 'M. Roux',
    address: '21 cours Romestang, 38200 Vienne',
    city: 'Vienne',
    serial: 'RV-2102-7765',
    kwh: 10,
    lastMeasureAt: '2026-09-23T23:00:00Z',
    phone: '06 45 67 89 01',
  },
  {
    id: 'sys-lefevre',
    name: 'Mme Lefèvre',
    address: '45 rue Anatole France, 69100 Villeurbanne',
    city: 'Villeurbanne',
    serial: 'RV-2010-5532',
    kwh: 10,
    pilotMode: 'heures_creuses',
    phone: '06 56 78 90 12',
  },
  {
    id: 'sys-bernard',
    name: 'M. Bernard',
    address: '12 avenue de la Libération, 69130 Écully',
    city: 'Écully',
    serial: 'RV-1954-0098',
    kwh: 15,
    phone: '06 67 89 01 23',
  },
  {
    id: 'sys-moreau',
    name: 'Mme Moreau',
    address: '6 rue de la République, 69600 Oullins',
    city: 'Oullins',
    serial: 'RV-2066-3304',
    kwh: 5,
  },
  {
    id: 'sys-faure',
    name: 'M. Faure',
    address: '17 rue Guillermin, 69500 Bron',
    city: 'Bron',
    serial: 'RV-2071-2210',
    kwh: 10,
  },
  {
    id: 'sys-girard',
    name: 'Mme Girard',
    address: '2 rue Pierre Brossolette, 69500 Bron',
    city: 'Bron',
    serial: 'RV-2072-4418',
    kwh: 5,
  },
  {
    id: 'sys-lambert',
    name: 'M. Lambert',
    address: '30 avenue Camille Rousset, 69500 Bron',
    city: 'Bron',
    serial: 'RV-2073-9051',
    kwh: 10,
  },
  {
    id: 'sys-bonnet',
    name: 'Mme Bonnet',
    address: '9 rue de la Pagère, 69500 Bron',
    city: 'Bron',
    serial: 'RV-2074-6627',
    kwh: 15,
  },
  {
    id: 'sys-chevalier',
    name: 'M. Chevalier',
    address: '55 boulevard Pinel, 69500 Bron',
    city: 'Bron',
    serial: 'RV-2075-1103',
    kwh: 10,
  },
  {
    id: 'sys-robin',
    name: 'Mme Robin',
    address: '4 place Curial, 69500 Bron',
    city: 'Bron',
    serial: 'RV-2076-8840',
    kwh: 5,
  },
  {
    id: 'sys-masson',
    name: 'M. Masson',
    address: '11 rue Jean Jaurès, 69500 Bron',
    city: 'Bron',
    serial: 'RV-2077-3392',
    kwh: 10,
  },
  {
    id: 'sys-dubois',
    name: 'Mme Dubois',
    address: '72 avenue Jean Jaurès, 69007 Lyon',
    city: 'Lyon 7',
    serial: 'RV-1999-4476',
    kwh: 10,
  },
  {
    id: 'sys-laurent',
    name: 'M. Laurent',
    address: '19 rue Francis de Pressensé, 69100 Villeurbanne',
    city: 'Villeurbanne',
    serial: 'RV-2003-5519',
    kwh: 15,
  },
  {
    id: 'sys-simon',
    name: 'Mme Simon',
    address: '5 avenue Victor Hugo, 69160 Tassin',
    city: 'Tassin',
    serial: 'RV-2015-2287',
    kwh: 5,
  },
  {
    id: 'sys-michel',
    name: 'M. Michel',
    address: '88 avenue des Frères Lumière, 69008 Lyon',
    city: 'Lyon 8',
    serial: 'RV-2021-6602',
    kwh: 10,
  },
  {
    id: 'sys-fontaine',
    name: 'Mme Fontaine',
    address: '23 rue Aristide Briand, 69800 Saint-Priest',
    city: 'Saint-Priest',
    serial: 'RV-2028-7713',
    kwh: 10,
  },
  {
    id: 'sys-rousseau',
    name: 'M. Rousseau',
    address: '7 rue Paul Bert, 69150 Décines',
    city: 'Décines',
    serial: 'RV-2035-0934',
    kwh: 15,
  },
];

// Systems of the "Coupure probable" demo scenario, with their last data times (all
// within one hour, more than 12 h ago so they read "Sans nouvelles").
const OUTAGE_LAST_DATA: Record<string, string> = {
  'sys-faure': '2026-09-24T00:05:00Z',
  'sys-girard': '2026-09-24T00:10:00Z',
  'sys-lambert': '2026-09-24T00:15:00Z',
  'sys-bonnet': '2026-09-24T00:20:00Z',
  'sys-chevalier': '2026-09-24T00:30:00Z',
  'sys-robin': '2026-09-24T00:40:00Z',
  'sys-masson': '2026-09-24T00:50:00Z',
};

function toSystem(seed: SystemSeed, index: number): System {
  const minutesAgo = 4 + ((index * 7) % 11);
  return {
    id: seed.id,
    serial: seed.serial,
    client: {
      name: seed.name,
      address: seed.address,
      ...(seed.phone !== undefined && { phone: seed.phone }),
    },
    city: seed.city,
    batteryLabel: `Revolty ${seed.kwh} kWh · ${MODULES[seed.kwh]} modules`,
    pilotMode: seed.pilotMode ?? 'autoconsommation',
    configuration: 'verifiee',
    lastMeasureAt:
      seed.lastMeasureAt === undefined
        ? new Date(new Date(DEMO_NOW_ISO).getTime() - minutesAgo * 60_000).toISOString()
        : seed.lastMeasureAt,
    installedAt: `202${4 + (index % 2)}-0${1 + (index % 9)}-1${index % 10}T08:00:00Z`,
    isNew: false,
  };
}

const ALERTS: Alert[] = [
  {
    id: 'al-petit',
    systemId: 'sys-petit',
    severity: 'grave',
    title: 'La batterie ne se recharge plus',
    clientImpact:
      "Plus de secours en cas de coupure, et sa facture remonte : le surplus solaire part sur le réseau au lieu d'être stocké.",
    checks: [
      'Le disjoncteur de la batterie est-il enclenché ?',
      'Le voyant de la batterie est-il vert ?',
      'Le câble de communication est-il bien branché ?',
    ],
    manipType: 'remise_en_service',
    since: '2026-09-21T12:00:00Z',
    resolvedAt: null,
  },
  {
    id: 'al-garnier',
    systemId: 'sys-garnier',
    severity: 'grave',
    title: 'Batterie arrêtée',
    clientImpact: 'Plus aucun stockage : la maison vit uniquement sur les panneaux et le réseau.',
    checks: [
      'Le disjoncteur de la batterie a-t-il sauté ?',
      "L'onduleur affiche-t-il un code d'erreur ?",
    ],
    manipType: 'remise_en_service',
    since: '2026-09-23T15:20:00Z',
    resolvedAt: null,
  },
  {
    id: 'al-durand',
    systemId: 'sys-durand',
    severity: 'mineure',
    title: 'Mesure de conso incohérente',
    clientImpact:
      'La batterie croit que la maison consomme moins que la réalité : elle se décharge trop peu le soir.',
    checks: [
      'Le tore est-il bien refermé autour du câble ?',
      'Est-il posé sur la phase, dans le bon sens (flèche vers la maison) ?',
    ],
    manipType: 'verifier_tore',
    since: '2026-09-22T08:00:00Z',
    resolvedAt: null,
  },
];

function manip(
  overrides: Partial<Manip> & Pick<Manip, 'id' | 'systemId' | 'type' | 'origin'>,
): Manip {
  return {
    alertId: null,
    createdAt: '2026-09-22T08:00:00Z',
    dueAt: null,
    openedByInstaller: false,
    status: 'a_faire',
    reopened: false,
    transmitted: false,
    confirmBy: null,
    attempts: [],
    ...overrides,
  };
}

const MANIPS: Manip[] = [
  manip({
    id: 'mp-petit',
    systemId: 'sys-petit',
    type: 'remise_en_service',
    origin: 'alerte',
    alertId: 'al-petit',
    createdAt: '2026-09-21T12:30:00Z',
    dueAt: '2026-09-24T16:00:00Z',
  }),
  manip({
    id: 'mp-garnier',
    systemId: 'sys-garnier',
    type: 'remise_en_service',
    origin: 'alerte',
    alertId: 'al-garnier',
    createdAt: '2026-09-23T15:50:00Z',
    dueAt: '2026-09-25T16:00:00Z',
  }),
  manip({
    id: 'mp-bernard',
    systemId: 'sys-bernard',
    type: 'changer_module',
    origin: 'revolty',
    createdAt: '2026-09-15T09:00:00Z',
    dueAt: '2026-09-22T16:00:00Z',
  }),
  manip({
    id: 'mp-durand',
    systemId: 'sys-durand',
    type: 'verifier_tore',
    origin: 'alerte',
    alertId: 'al-durand',
    createdAt: '2026-09-22T09:00:00Z',
    dueAt: '2026-10-01T16:00:00Z',
    openedByInstaller: true,
  }),
  manip({
    id: 'mp-roux',
    systemId: 'sys-roux',
    type: 'rappeler_client',
    origin: 'revolty',
    createdAt: '2026-09-24T07:00:00Z',
    dueAt: '2026-10-02T16:00:00Z',
  }),
];

const PROFILE_EXTRAS: Record<string, Partial<MeasureProfile>> = {
  // Broken before sunrise on Monday 21 so the whole day reads abnormal (alert raised at 14:00).
  'sys-petit': { brokenFrom: '2026-09-21T04:00:00Z' },
  'sys-garnier': { brokenFrom: '2026-09-23T15:20:00Z' },
  'sys-roux': { silentFrom: '2026-09-23T23:15:00Z' },
  'sys-moreau': { lostWindows: [{ from: '2026-09-22T06:00:00Z', to: '2026-09-22T11:00:00Z' }] },
};

export function createDemoState(): DomainState {
  // structuredClone keeps every demo reset independent from previous mutations.
  return structuredClone({
    systems: SEEDS.map(toSystem),
    alerts: ALERTS,
    manips: MANIPS,
    queue: [],
  });
}

export function profileFor(system: System): MeasureProfile {
  const base: MeasureProfile = {
    systemId: system.id,
    seed: system.serial,
    pilotMode: system.pilotMode,
  };
  const outage = OUTAGE_LAST_DATA[system.id];
  const extras = PROFILE_EXTRAS[system.id] ?? {};
  // A system that went silent during the demo must show the "en attente de remontée" band.
  if (outage !== undefined && system.lastMeasureAt === outage) {
    return {
      ...base,
      ...extras,
      silentFrom: new Date(new Date(outage).getTime() + 15 * 60_000).toISOString(),
    };
  }
  return { ...base, ...extras };
}

export function applyOutageScenario(state: DomainState): DomainState {
  return {
    ...state,
    systems: state.systems.map((s) => {
      const last = OUTAGE_LAST_DATA[s.id];
      return last === undefined ? s : { ...s, lastMeasureAt: last };
    }),
  };
}

// Demo only: the problem comes back (e.g. the breaker trips again) to show the reopening rule.
export function bringAlertBack(state: DomainState, systemId: string, now: Date): DomainState {
  return {
    ...state,
    alerts: state.alerts.map((a) =>
      a.systemId === systemId && a.severity === 'grave' && a.resolvedAt !== null
        ? { ...a, resolvedAt: null, since: now.toISOString() }
        : a,
    ),
  };
}
