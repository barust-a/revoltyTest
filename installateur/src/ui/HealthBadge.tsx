import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HEALTH_LABEL } from '../core/health';
import type { HealthStatus } from '../core/types';
import { theme, type ThemeColor } from './theme';
import { Icon, type IconName, Txt } from './Txt';

// Health = color + icon + label, never color alone (WCAG 1.4.1).
// "Sans nouvelles" is grey with a DASHED outline: in ISA-101 grey alone reads as "normal".
export const HEALTH_VISUAL: Record<
  HealthStatus,
  { icon: IconName; ink: ThemeColor; bg: ThemeColor; border: ThemeColor; dashed: boolean }
> = {
  en_panne: { icon: 'error', ink: 'danger', bg: 'dangerBg', border: 'danger', dashed: false },
  sans_nouvelles: {
    icon: 'cloud-off',
    ink: 'offlineText',
    bg: 'card',
    border: 'offline',
    dashed: true,
  },
  a_surveiller: {
    icon: 'warning',
    ink: 'warning',
    bg: 'warningBg',
    border: 'warning',
    dashed: false,
  },
  ok: { icon: 'check-circle', ink: 'teal', bg: 'card', border: 'card', dashed: false },
};

export function HealthIcon({ status, size = 24 }: { status: HealthStatus; size?: number }) {
  const v = HEALTH_VISUAL[status];
  return <Icon name={v.icon} size={size} color={v.ink} testID={`health-icon-${status}`} />;
}

export function HealthPill({ status, reason }: { status: HealthStatus; reason?: string | null }) {
  const v = HEALTH_VISUAL[status];
  return (
    <View style={styles.row}>
      <HealthIcon status={status} size={20} />
      <Txt variant="strong" color={v.ink}>
        {HEALTH_LABEL[status]}
      </Txt>
      {reason != null && <Txt variant="body">· {reason}</Txt>}
    </View>
  );
}

export function healthBoxStyle(status: HealthStatus) {
  const v = HEALTH_VISUAL[status];
  return {
    backgroundColor: theme.colors[v.bg],
    borderColor: theme.colors[v.border],
    borderStyle: v.dashed ? ('dashed' as const) : ('solid' as const),
    borderWidth: 2,
  };
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
});
