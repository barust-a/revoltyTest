// Pure presentation logic for the home screen: everything the component needs to decide
// WHAT to show, computed from core/* results plus a bit of local UI state (query, filter,
// which groups are expanded). No React, no ports — only vitest-testable functions.
import { HEALTH_LABEL, HEALTH_RANK } from '../../core/health';
import { filterRows, type OutageGroup, type ParkRow, type ParkView } from '../../core/park';
import type { TodoCard } from '../../core/todo';
import { failedCount, pendingCount } from '../../core/sync';
import { formatClock, localDayKey } from '../../core/time';
import type { DomainState, HealthStatus, QueueItem } from '../../core/types';
import type { IconName } from '../../ui/Txt';
import { capitalizeFirst } from '../shared';

// ---- Date header ("Jeudi 24 septembre") ------------------------------------------------
// Core forbids Intl (determinism); we follow the same plain-arithmetic style as
// core/time.ts's formatDayShort, just with full (non-abbreviated) names.

const DOW_FULL = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTH_FULL = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export function formatFullDate(now: Date): string {
  const dayKey = localDayKey(now.toISOString());
  const d = new Date(`${dayKey}T00:00:00Z`);
  const dow = DOW_FULL[d.getUTCDay()] ?? '';
  const month = MONTH_FULL[d.getUTCMonth()] ?? '';
  return `${capitalizeFirst(dow)} ${d.getUTCDate()} ${month}`;
}

// ---- Small plural helper -----------------------------------------------------------------

export function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n <= 1 ? singular : pluralForm}`;
}

// ---- Connection banner --------------------------------------------------------------------

export type ConnectionView = {
  offline: boolean;
  label: string;
  pendingLabel: string | null;
  failedLabel: string | null;
};

export function buildConnectionView(
  offline: boolean,
  dataAsOf: string,
  queue: QueueItem[],
): ConnectionView {
  const clock = formatClock(dataAsOf);
  const pending = pendingCount(queue);
  const failed = failedCount(queue);
  const pendingLabel = offline
    ? plural(pending, "clôture en attente d'envoi", "clôtures en attente d'envoi")
    : pending > 0
      ? plural(pending, 'envoi en attente', 'envois en attente')
      : null;
  return {
    offline,
    label: offline ? `Hors ligne · données de ${clock}` : `En ligne · à jour à ${clock}`,
    pendingLabel,
    failedLabel: failed > 0 ? plural(failed, 'envoi en échec', 'envois en échec') : null,
  };
}

// ---- Health tiles ---------------------------------------------------------------------------

export type HealthTile = { status: HealthStatus; count: number; label: string };

const TILE_ORDER: HealthStatus[] = ['en_panne', 'sans_nouvelles', 'a_surveiller', 'ok'];

export function buildHealthTiles(counts: Record<HealthStatus, number>): HealthTile[] {
  return TILE_ORDER.map((status) => ({
    status,
    count: counts[status],
    label: HEALTH_LABEL[status],
  })).filter((tile) => tile.count > 0);
}

export function filterBadgeLabel(status: HealthStatus): string {
  return `Filtre : ${HEALTH_LABEL[status]} · Tout afficher`;
}

// ---- "À faire" card visuals -------------------------------------------------------------------

export function urgencyIcon(urgency: NonNullable<TodoCard['urgency']>): IconName {
  return urgency === 'alerte' ? 'error' : 'schedule';
}

export function dueVisual(urgency: TodoCard['urgency']): { icon: IconName; late: boolean } {
  return urgency === 'retard' ? { icon: 'event-busy', late: true } : { icon: 'event', late: false };
}

// A card's footer shows a SyncBadge instead of its due date once its last closure attempt
// is queued (pending or failed). buildTodo only exposes the sync STATE; find the queue item
// itself so the "Réessayer" button can call retrySync(queueId).
export function syncItemFor(domain: DomainState, manipId: string): QueueItem | null {
  const manip = domain.manips.find((m) => m.id === manipId);
  const lastAttempt = manip?.attempts[manip.attempts.length - 1];
  if (lastAttempt === undefined) return null;
  return domain.queue.find((q) => q.refId === lastAttempt.id) ?? null;
}

export function isAwaitingConfirmation(domain: DomainState, manipId: string): boolean {
  return domain.manips.find((m) => m.id === manipId)?.status === 'a_confirmer';
}

// ---- "Mon parc" list --------------------------------------------------------------------------

export type ParkListItem =
  | { kind: 'row'; row: ParkRow }
  | { kind: 'outage'; group: OutageGroup; expanded: boolean }
  | { kind: 'okGroup'; count: number; expanded: boolean };

// Search or a status filter flattens everything (outage members and OK rows included) so the
// installer always sees direct hits, never a group they'd have to open first.
export function buildParkList(
  park: ParkView,
  query: string,
  status: HealthStatus | null,
  outageExpanded: boolean,
  okExpanded: boolean,
): ParkListItem[] {
  const searching = query.trim() !== '' || status !== null;
  if (searching) {
    const all = [...park.rows, ...(park.outage?.rows ?? [])];
    return filterRows(all, query, status).map((row): ParkListItem => ({ kind: 'row', row }));
  }

  const items: ParkListItem[] = [];
  let outageInserted = park.outage === null;
  const outage = park.outage;
  for (const row of park.rows) {
    if (row.health.status === 'ok') continue;
    if (
      !outageInserted &&
      outage !== null &&
      HEALTH_RANK[row.health.status] > HEALTH_RANK.en_panne
    ) {
      items.push({ kind: 'outage', group: outage, expanded: outageExpanded });
      outageInserted = true;
    }
    items.push({ kind: 'row', row });
  }
  if (!outageInserted && outage !== null) {
    items.push({ kind: 'outage', group: outage, expanded: outageExpanded });
  }
  if (outageExpanded && outage !== null) {
    for (const row of outage.rows) items.push({ kind: 'row', row });
  }
  if (park.counts.ok > 0) {
    items.push({ kind: 'okGroup', count: park.counts.ok, expanded: okExpanded });
    if (okExpanded) {
      for (const row of park.rows) if (row.health.status === 'ok') items.push({ kind: 'row', row });
    }
  }
  return items;
}

export function outageTitle(group: OutageGroup): string {
  return `Coupure probable · ${group.rows[0]?.city ?? ''}`;
}

export function outageDetail(group: OutageGroup): string {
  return `${plural(group.systemIds.length, 'système sans nouvelles', 'systèmes sans nouvelles')} depuis ${formatClock(group.since)}`;
}

export function okGroupLabel(count: number): string {
  return plural(count, 'système OK', 'systèmes OK');
}
