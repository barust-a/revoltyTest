import { deriveHealth, HEALTH_RANK } from './health';
import type { Health } from './health';
import { HOUR } from './time';
import type { Alert, HealthStatus, System } from './types';

export const OUTAGE_MIN_SYSTEMS = 5;

export type ParkRow = {
  systemId: string;
  clientName: string;
  city: string;
  serial: string;
  health: Health;
  isNew: boolean;
};

export type OutageGroup = { systemIds: string[]; since: string; rows: ParkRow[] };

function byNameAsc(a: ParkRow, b: ParkRow): number {
  return a.clientName < b.clientName ? -1 : a.clientName > b.clientName ? 1 : 0;
}

export function groupOutages(rows: ParkRow[]): { outage: OutageGroup | null; rest: ParkRow[] } {
  const candidates = rows
    .filter((r) => r.health.status === 'sans_nouvelles' && r.health.since !== null)
    .map((r) => ({ row: r, since: new Date(r.health.since as string).getTime() }))
    .sort((a, b) => a.since - b.since);

  let best: typeof candidates = [];
  for (let i = 0; i < candidates.length; i++) {
    const start = candidates[i]!.since;
    let j = i;
    while (j + 1 < candidates.length && candidates[j + 1]!.since - start <= HOUR) {
      j++;
    }
    const window = candidates.slice(i, j + 1);
    if (window.length > best.length) best = window;
  }

  if (best.length < OUTAGE_MIN_SYSTEMS) {
    return { outage: null, rest: rows };
  }

  const groupedIds = new Set(best.map((c) => c.row.systemId));
  const earliest = best.reduce((min, c) => (c.since < min.since ? c : min));
  const outage: OutageGroup = {
    systemIds: best.map((c) => c.row.systemId),
    since: earliest.row.health.since as string,
    rows: best.map((c) => c.row).sort(byNameAsc),
  };
  const rest = rows.filter((r) => !groupedIds.has(r.systemId));
  return { outage, rest };
}

export function sortPark(rows: ParkRow[]): ParkRow[] {
  return [...rows].sort((a, b) => {
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
    const rankDiff = HEALTH_RANK[a.health.status] - HEALTH_RANK[b.health.status];
    if (rankDiff !== 0) return rankDiff;
    const sinceA = a.health.since ?? '';
    const sinceB = b.health.since ?? '';
    if (sinceA !== sinceB) return sinceA < sinceB ? -1 : 1;
    return byNameAsc(a, b);
  });
}

export type ParkView = {
  counts: Record<HealthStatus, number>;
  rows: ParkRow[];
  outage: OutageGroup | null;
  total: number;
  allOk: boolean;
};

export function buildPark(systems: System[], alerts: Alert[], now: Date): ParkView {
  const rows: ParkRow[] = systems.map((system) => ({
    systemId: system.id,
    clientName: system.client.name,
    city: system.city,
    serial: system.serial,
    health: deriveHealth(system, alerts, now),
    isNew: system.isNew,
  }));

  const counts: Record<HealthStatus, number> = {
    en_panne: 0,
    sans_nouvelles: 0,
    a_surveiller: 0,
    ok: 0,
  };
  for (const row of rows) counts[row.health.status]++;

  const { outage, rest } = groupOutages(rows);

  return {
    counts,
    rows: sortPark(rest),
    outage,
    total: rows.length,
    allOk: counts.ok === rows.length,
  };
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function filterRows(rows: ParkRow[], query: string, status: HealthStatus | null): ParkRow[] {
  const q = normalize(query.trim());
  return rows.filter((row) => {
    if (status !== null && row.health.status !== status) return false;
    if (q === '') return true;
    return (
      normalize(row.clientName).includes(q) ||
      normalize(row.city).includes(q) ||
      normalize(row.serial).includes(q)
    );
  });
}
