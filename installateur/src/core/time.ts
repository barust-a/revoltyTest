// Wall-clock helpers for a Lyon-based demo. Core must not use Intl/toLocale* (determinism),
// so the offset is fixed: the demo runs in September, i.e. CEST (UTC+2).
export const PARIS_OFFSET_MIN = 120;

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const OFFSET_MS = PARIS_OFFSET_MIN * MINUTE;
const DOW = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

const pad = (n: number) => String(n).padStart(2, '0');

function shifted(iso: string): Date {
  return new Date(new Date(iso).getTime() + OFFSET_MS);
}

function keyOf(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function parseKey(dayKey: string): Date {
  return new Date(`${dayKey}T00:00:00Z`);
}

export function localDayKey(iso: string): string {
  return keyOf(shifted(iso));
}

export function dayStartIso(dayKey: string): string {
  return new Date(parseKey(dayKey).getTime() - OFFSET_MS).toISOString();
}

export function addDays(dayKey: string, n: number): string {
  return keyOf(new Date(parseKey(dayKey).getTime() + n * DAY));
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((parseKey(toKey).getTime() - parseKey(fromKey).getTime()) / DAY);
}

export function localHour(iso: string): number {
  const d = shifted(iso);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}

export function formatDayShort(dayKey: string): string {
  const d = parseKey(dayKey);
  const day = d.getUTCDate();
  return `${DOW[d.getUTCDay()]} ${day === 1 ? '1er' : day} ${MONTHS[d.getUTCMonth()]}`;
}

export function formatClock(iso: string): string {
  const d = shifted(iso);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function elapsedMs(iso: string, now: Date): number {
  return Math.max(0, now.getTime() - new Date(iso).getTime());
}

export function formatAgo(iso: string, now: Date): string {
  const ms = elapsedMs(iso, now);
  if (ms < MINUTE) return "à l'instant";
  if (ms < HOUR) return `il y a ${Math.floor(ms / MINUTE)} min`;
  if (ms < 2 * DAY) return `il y a ${Math.floor(ms / HOUR)} h`;
  return `il y a ${Math.floor(ms / DAY)} j`;
}

export function formatDuration(fromIso: string, now: Date): string {
  const ms = elapsedMs(fromIso, now);
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)} min`;
  if (ms < DAY) return `${Math.floor(ms / HOUR)} h`;
  const days = Math.floor(ms / DAY);
  return `${days} ${days === 1 ? 'jour' : 'jours'}`;
}

export function formatDue(iso: string, now: Date): string {
  const diff = daysBetween(localDayKey(now.toISOString()), localDayKey(iso));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';
  return formatDayShort(localDayKey(iso));
}

export function formatSinceDetailed(iso: string, now: Date): string {
  const hour = shifted(iso).getUTCHours();
  return `Depuis ${formatDayShort(localDayKey(iso))}, ${hour} h (${formatDuration(iso, now)})`;
}
