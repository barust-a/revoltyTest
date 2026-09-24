import { enqueue } from './sync';
import { addDays, dayStartIso, HOUR, localDayKey } from './time';
import type { Closure, DomainState, Manip, NextStep } from './types';

export const CONFIRM_WINDOW_MS = 24 * HOUR;

export type ClosureInput = {
  manipId: string;
  result: 'resolu' | 'pas_resolu';
  next?: NextStep;
  actions: string[];
  photos: string[];
  note?: string;
  audioMemo?: string;
  arrivedAt: string;
};

export function nextVisitDue(now: Date): string {
  const nextDayKey = addDays(localDayKey(now.toISOString()), 1);
  return new Date(new Date(dayStartIso(nextDayKey)).getTime() + 18 * HOUR).toISOString();
}

export function markOpened(state: DomainState, manipId: string): DomainState {
  const manip = state.manips.find((m) => m.id === manipId);
  if (manip === undefined || manip.openedByInstaller) return state;

  return {
    ...state,
    manips: state.manips.map((m) => (m.id === manipId ? { ...m, openedByInstaller: true } : m)),
  };
}

function clientLabel(state: DomainState, systemId: string): string {
  const system = state.systems.find((s) => s.id === systemId);
  return system === undefined ? 'Clôture' : `Clôture · ${system.client.name}`;
}

function enqueueClosure(
  state: DomainState,
  closure: Closure,
  systemId: string,
  now: Date,
): DomainState['queue'] {
  return enqueue(state.queue, {
    id: `q-${closure.id}`,
    kind: 'cloture',
    refId: closure.id,
    systemId,
    label: clientLabel(state, systemId),
    createdAt: now.toISOString(),
  });
}

export function applyClosure(state: DomainState, input: ClosureInput, now: Date): DomainState {
  const manip = state.manips.find((m) => m.id === input.manipId);
  if (manip === undefined) return state;

  const closure: Closure = {
    id: `${manip.id}-a${manip.attempts.length + 1}`,
    manipId: manip.id,
    result: input.result,
    ...(input.result === 'pas_resolu' ? { next: input.next ?? 'repasser' } : {}),
    actions: input.actions,
    photos: input.photos,
    ...(input.note !== undefined ? { note: input.note } : {}),
    ...(input.audioMemo !== undefined ? { audioMemo: input.audioMemo } : {}),
    arrivedAt: input.arrivedAt,
    closedAt: now.toISOString(),
  };

  const updates: Partial<Manip> =
    input.result === 'resolu'
      ? manip.alertId !== null
        ? {
            status: 'attente_confirmation',
            confirmBy: new Date(now.getTime() + CONFIRM_WINDOW_MS).toISOString(),
            reopened: false,
          }
        : { status: 'cloturee', confirmBy: null }
      : closure.next === 'transmettre_revolty'
        ? { status: 'a_faire', transmitted: true, dueAt: null }
        : { status: 'a_faire', transmitted: false, dueAt: nextVisitDue(now) };

  const updatedManip: Manip = {
    ...manip,
    ...updates,
    openedByInstaller: true,
    attempts: [...manip.attempts, closure],
  };

  return {
    ...state,
    manips: state.manips.map((m) => (m.id === manip.id ? updatedManip : m)),
    queue: enqueueClosure(state, closure, manip.systemId, now),
  };
}

export function confirmSelfResolved(state: DomainState, manipId: string, now: Date): DomainState {
  const manip = state.manips.find((m) => m.id === manipId);
  if (manip === undefined || manip.status !== 'a_confirmer') return state;

  const closure: Closure = {
    id: `${manip.id}-a${manip.attempts.length + 1}`,
    manipId: manip.id,
    result: 'auto_resolue',
    actions: [],
    photos: [],
    arrivedAt: now.toISOString(),
    closedAt: now.toISOString(),
  };

  const updatedManip: Manip = {
    ...manip,
    status: 'cloturee',
    attempts: [...manip.attempts, closure],
  };

  return {
    ...state,
    manips: state.manips.map((m) => (m.id === manip.id ? updatedManip : m)),
    queue: enqueueClosure(state, closure, manip.systemId, now),
  };
}

function reconcileManip(state: DomainState, manip: Manip, now: Date): Manip {
  if (manip.alertId === null) return manip;
  const alert = state.alerts.find((a) => a.id === manip.alertId);
  if (alert === undefined) return manip;

  const active = alert.resolvedAt === null;

  if (manip.status === 'a_faire' && alert.resolvedAt !== null) {
    if (!manip.openedByInstaller) {
      const closure: Closure = {
        id: `${manip.id}-a${manip.attempts.length + 1}`,
        manipId: manip.id,
        result: 'auto_resolue',
        actions: [],
        photos: [],
        arrivedAt: alert.resolvedAt,
        closedAt: alert.resolvedAt,
      };
      return { ...manip, status: 'cloturee', attempts: [...manip.attempts, closure] };
    }
    return { ...manip, status: 'a_confirmer' };
  }

  if (manip.status === 'a_confirmer' && active) {
    return { ...manip, status: 'a_faire' };
  }

  if (manip.status === 'attente_confirmation') {
    if (!active) {
      return { ...manip, status: 'cloturee' };
    }
    if (manip.confirmBy !== null && now.getTime() >= new Date(manip.confirmBy).getTime()) {
      return {
        ...manip,
        status: 'a_faire',
        reopened: true,
        confirmBy: null,
        dueAt: nextVisitDue(now),
      };
    }
    return manip;
  }

  if (manip.status === 'cloturee' && manip.confirmBy !== null) {
    const windowOver = now.getTime() >= new Date(manip.confirmBy).getTime();
    if (windowOver) {
      return { ...manip, confirmBy: null };
    }
    const lastAttempt = manip.attempts[manip.attempts.length - 1];
    if (
      active &&
      lastAttempt !== undefined &&
      new Date(alert.since).getTime() > new Date(lastAttempt.closedAt).getTime()
    ) {
      return {
        ...manip,
        status: 'a_faire',
        reopened: true,
        confirmBy: null,
        dueAt: nextVisitDue(now),
      };
    }
    return manip;
  }

  return manip;
}

export function reconcileAlerts(state: DomainState, now: Date): DomainState {
  let changed = false;
  const manips = state.manips.map((manip) => {
    const updated = reconcileManip(state, manip, now);
    if (updated !== manip) changed = true;
    return updated;
  });

  return changed ? { ...state, manips } : state;
}
