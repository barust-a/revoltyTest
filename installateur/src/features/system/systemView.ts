// Pure presentation logic for the system detail screen: no store, no ports (spec §3.4 B).
import { activeAlertsFor } from '../../core/health';
import { isOpenTodo } from '../../core/todo';
import type { Alert, Manip, Severity } from '../../core/types';
import type { IconName } from '../../ui/Txt';
import type { ThemeColor } from '../../ui/theme';
import { SYSTEM_STRINGS } from './strings';

export const SEVERITY_VISUAL: Record<Severity, { label: string; color: ThemeColor }> = {
  grave: { label: SYSTEM_STRINGS.severityGrave, color: 'danger' },
  mineure: { label: SYSTEM_STRINGS.severityMineure, color: 'warning' },
};

// A manip is "linked" to an alert while it is not closed yet (a_faire, attente_confirmation, a_confirmer).
export function openManipForAlert(alertId: string, manips: Manip[]): Manip | null {
  return manips.find((m) => m.alertId === alertId && m.status !== 'cloturee') ?? null;
}

// Feeds the header "Créer une manip" button (spec: first active alert without an open manip).
export function firstAlertWithoutOpenManip(
  systemId: string,
  alerts: Alert[],
  manips: Manip[],
): Alert | null {
  const active = activeAlertsFor(systemId, alerts);
  return active.find((alert) => openManipForAlert(alert.id, manips) === null) ?? null;
}

export function resolvedAlertsFor(systemId: string, alerts: Alert[]): Alert[] {
  return alerts
    .filter((a) => a.systemId === systemId && a.resolvedAt !== null)
    .sort((a, b) => new Date(b.resolvedAt ?? 0).getTime() - new Date(a.resolvedAt ?? 0).getTime());
}

// "Manips en cours": open manips plus those awaiting the battery's self-resolve confirmation.
export function ongoingManipsFor(systemId: string, manips: Manip[]): Manip[] {
  return manips
    .filter(
      (m) => m.systemId === systemId && (isOpenTodo(m) || m.status === 'attente_confirmation'),
    )
    .sort((a, b) => {
      const aDue = a.dueAt === null ? Infinity : new Date(a.dueAt).getTime();
      const bDue = b.dueAt === null ? Infinity : new Date(b.dueAt).getTime();
      return aDue - bDue;
    });
}

export function lowerFirst(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toLowerCase() + text.slice(1);
}

export type VerdictCardLines = { icon: IconName; primary: string; secondary: string };

export function verdictCardLines(params: {
  kind: 'normal' | 'anormal' | 'insuffisant';
  title: string;
  detail: string;
  dayKey: string;
  anomalyStartDayLabel: string | null;
}): VerdictCardLines {
  const { kind, title, detail, anomalyStartDayLabel } = params;
  if (kind === 'anormal') {
    return {
      icon: 'trending-down',
      primary: SYSTEM_STRINGS.anomalySince(anomalyStartDayLabel ?? ''),
      secondary: title,
    };
  }
  if (kind === 'insuffisant') {
    return { icon: 'cloud-off', primary: title, secondary: detail };
  }
  return {
    icon: 'check-circle',
    primary: SYSTEM_STRINGS.yesterdayNormal(lowerFirst(title)),
    secondary: detail,
  };
}
