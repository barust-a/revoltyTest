import { formatDuration, HOUR } from './time';
import type { Alert, HealthStatus, System } from './types';

export const NO_DATA_AFTER_MS = 12 * HOUR;

export type Health = { status: HealthStatus; reason: string | null; since: string | null };

export const HEALTH_LABEL: Record<HealthStatus, string> = {
  en_panne: 'En panne',
  sans_nouvelles: 'Sans nouvelles',
  a_surveiller: 'À surveiller',
  ok: 'OK',
};

export const HEALTH_RANK: Record<HealthStatus, number> = {
  en_panne: 0,
  sans_nouvelles: 1,
  a_surveiller: 2,
  ok: 3,
};

export function activeAlertsFor(systemId: string, alerts: Alert[]): Alert[] {
  return alerts
    .filter((a) => a.systemId === systemId && a.resolvedAt === null)
    .sort((a, b) => new Date(a.since).getTime() - new Date(b.since).getTime());
}

export function deriveHealth(system: System, alerts: Alert[], now: Date): Health {
  const active = activeAlertsFor(system.id, alerts);

  const oldestGrave = active.find((a) => a.severity === 'grave');
  if (oldestGrave !== undefined) {
    return { status: 'en_panne', reason: oldestGrave.title, since: oldestGrave.since };
  }

  if (system.lastMeasureAt === null) {
    return { status: 'sans_nouvelles', reason: 'Aucune donnée reçue', since: null };
  }

  const sinceLastMeasure = now.getTime() - new Date(system.lastMeasureAt).getTime();
  if (sinceLastMeasure > NO_DATA_AFTER_MS) {
    return {
      status: 'sans_nouvelles',
      reason: `depuis ${formatDuration(system.lastMeasureAt, now)}`,
      since: system.lastMeasureAt,
    };
  }

  const oldestMineure = active.find((a) => a.severity === 'mineure');
  if (oldestMineure !== undefined) {
    return { status: 'a_surveiller', reason: oldestMineure.title, since: oldestMineure.since };
  }

  return { status: 'ok', reason: null, since: null };
}
