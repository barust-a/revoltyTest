import { DomainError } from './errors';
import { addDays, dayStartIso, HOUR, localDayKey, MINUTE } from './time';
import type { DomainState, Manip } from './types';

export const GRACE_MS = 30 * MINUTE;

export function shouldCreateManip(alert: DomainState['alerts'][number], now: Date): boolean {
  if (alert.severity !== 'grave' || alert.resolvedAt !== null) return false;
  return now.getTime() - new Date(alert.since).getTime() >= GRACE_MS;
}

function lyonEighteenOf(dayKey: string): string {
  return new Date(new Date(dayStartIso(dayKey)).getTime() + 18 * HOUR).toISOString();
}

export function dueToday(now: Date): string {
  const todayKey = localDayKey(now.toISOString());
  const todayEighteen = lyonEighteenOf(todayKey);
  if (now.getTime() < new Date(todayEighteen).getTime()) return todayEighteen;
  return lyonEighteenOf(addDays(todayKey, 1));
}

export function dueTomorrow(now: Date): string {
  return lyonEighteenOf(addDays(localDayKey(now.toISOString()), 1));
}

function newManipFromAlert(
  alert: DomainState['alerts'][number],
  k: number,
  dueAt: string,
  now: Date,
): Manip {
  return {
    id: `mp-${alert.id}-${k}`,
    systemId: alert.systemId,
    type: alert.manipType,
    origin: 'alerte',
    alertId: alert.id,
    createdAt: now.toISOString(),
    dueAt,
    openedByInstaller: false,
    status: 'a_faire',
    reopened: false,
    transmitted: false,
    confirmBy: null,
    attempts: [],
  };
}

export function spawnAlertManips(
  state: DomainState,
  now: Date,
  excludedSystemIds: readonly string[] = [],
): DomainState {
  const excluded = new Set(excludedSystemIds);
  const newManips: Manip[] = [];

  for (const alert of state.alerts) {
    if (!shouldCreateManip(alert, now) || excluded.has(alert.systemId)) continue;
    const existingForAlert = state.manips.filter((m) => m.alertId === alert.id);
    if (existingForAlert.some((m) => m.status !== 'cloturee')) continue;
    newManips.push(newManipFromAlert(alert, existingForAlert.length + 1, dueToday(now), now));
  }

  if (newManips.length === 0) return state;
  return { ...state, manips: [...state.manips, ...newManips] };
}

export function createManipFromAlert(state: DomainState, alertId: string, now: Date): DomainState {
  const alert = state.alerts.find((a) => a.id === alertId);
  if (alert === undefined) throw new DomainError('alert_not_found');

  const existingForAlert = state.manips.filter((m) => m.alertId === alertId);
  if (existingForAlert.some((m) => m.status !== 'cloturee')) return state;

  const manip = newManipFromAlert(alert, existingForAlert.length + 1, dueTomorrow(now), now);
  return { ...state, manips: [...state.manips, manip] };
}
