import { daysBetween, formatDayShort, formatDue, localDayKey } from './time';
import type { Alert, DomainState, Manip, ManipType, Origin, SyncState } from './types';

export const TODO_LIMIT = 5;

export const MANIP_VERB: Record<ManipType, string> = {
  remise_en_service: 'Remise en service',
  verifier_tore: 'Vérifier le tore',
  changer_module: 'Changer un module',
  rappeler_client: 'Rappeler le client',
  verifier_communication: 'Vérifier la communication',
};

export function isOpenTodo(manip: Manip): boolean {
  return manip.status === 'a_faire' || manip.status === 'a_confirmer';
}

export function urgencyReason(
  manip: Manip,
  alerts: Alert[],
  now: Date,
): 'alerte' | 'retard' | null {
  if (manip.alertId !== null) {
    const alert = alerts.find((a) => a.id === manip.alertId);
    if (alert !== undefined && alert.severity === 'grave' && alert.resolvedAt === null) {
      return 'alerte';
    }
  }
  if (manip.dueAt !== null && new Date(manip.dueAt).getTime() < now.getTime()) {
    return 'retard';
  }
  return null;
}

// An active severe alert outranks a merely late visit: the client has no backup right now.
const URGENCY_RANK: Record<string, number> = { alerte: 0, retard: 1, null: 2 };

export function sortTodo(manips: Manip[], alerts: Alert[], now: Date): Manip[] {
  return manips
    .filter(isOpenTodo)
    .map((manip) => ({ manip, urgency: urgencyReason(manip, alerts, now) }))
    .sort((a, b) => {
      const rank = URGENCY_RANK[String(a.urgency)]! - URGENCY_RANK[String(b.urgency)]!;
      if (rank !== 0) return rank;
      const aDue = a.manip.dueAt === null ? Infinity : new Date(a.manip.dueAt).getTime();
      const bDue = b.manip.dueAt === null ? Infinity : new Date(b.manip.dueAt).getTime();
      return aDue - bDue;
    })
    .map((entry) => entry.manip);
}

export type TodoCard = {
  manipId: string;
  systemId: string;
  type: ManipType;
  verb: string;
  clientName: string;
  city: string;
  due: string | null;
  origin: Origin;
  urgency: 'alerte' | 'retard' | null;
  urgencyLabel: string | null;
  mentions: string[];
  sync: SyncState | null;
};

export function buildTodo(
  state: DomainState,
  now: Date,
  limit = TODO_LIMIT,
): { cards: TodoCard[]; hiddenCount: number; total: number } {
  const systemById = new Map(state.systems.map((s) => [s.id, s]));
  const openWithSystem = state.manips.filter((m) => isOpenTodo(m) && systemById.has(m.systemId));
  const sorted = sortTodo(openWithSystem, state.alerts, now);

  const cards = sorted.slice(0, limit).map((manip): TodoCard => {
    const system = systemById.get(manip.systemId);
    if (system === undefined) throw new Error('unreachable');

    const urgency = urgencyReason(manip, state.alerts, now);
    const mentions: string[] = [];
    if (manip.status === 'a_confirmer') mentions.push('Résolu tout seul · à confirmer');
    if (manip.reopened) mentions.push('Rouverte · le problème est revenu');
    if (manip.transmitted) mentions.push('Transmise à Revolty');
    const failedAttempts = manip.attempts.filter((a) => a.result === 'pas_resolu').length;
    if (failedAttempts >= 1) mentions.push(`${failedAttempts + 1}ᵉ passage`);

    const lastAttempt = manip.attempts[manip.attempts.length - 1];
    const queueItem =
      lastAttempt === undefined ? undefined : state.queue.find((q) => q.refId === lastAttempt.id);

    return {
      manipId: manip.id,
      systemId: manip.systemId,
      type: manip.type,
      verb: MANIP_VERB[manip.type],
      clientName: system.client.name,
      city: system.city,
      due: dueText(manip.dueAt, urgency, now),
      origin: manip.origin,
      urgency,
      urgencyLabel: urgencyText(manip.dueAt, urgency, now),
      mentions,
      sync: queueItem === undefined ? null : queueItem.sync,
    };
  });

  return { cards, hiddenCount: sorted.length - cards.length, total: sorted.length };
}

function dueText(dueAt: string | null, urgency: TodoCard['urgency'], now: Date): string | null {
  if (dueAt === null) return null;
  if (urgency === 'retard') return `Prévu ${formatDayShort(localDayKey(dueAt))}`;
  return formatDue(dueAt, now);
}

function urgencyText(dueAt: string | null, urgency: TodoCard['urgency'], now: Date): string | null {
  if (urgency === 'alerte') return 'Urgent · via alerte';
  if (urgency !== 'retard' || dueAt === null) return null;
  const late = daysBetween(localDayKey(dueAt), localDayKey(now.toISOString()));
  return late >= 1 ? `Urgent · ${late} j de retard` : 'Urgent · en retard';
}
