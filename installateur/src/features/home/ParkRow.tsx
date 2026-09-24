import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HEALTH_LABEL } from '../../core/health';
import { HealthIcon, HEALTH_VISUAL } from '../../ui/HealthBadge';
import { theme } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import type { ParkListItem } from './homeView';
import { okGroupLabel, outageDetail, outageTitle } from './homeView';
import { HOME_STRINGS } from './strings';

// One row of "Mon parc" (spec §3.4 A.4 / maquette 1c): a single system, the grouped
// "Coupure probable" outage header, or the collapsed "N systèmes OK" header.
export function ParkListRow({
  item,
  first,
  onToggleOutage,
  onToggleOk,
}: {
  item: ParkListItem;
  first: boolean;
  onToggleOutage: () => void;
  onToggleOk: () => void;
}) {
  if (item.kind === 'row') {
    const { row } = item;
    const visual = HEALTH_VISUAL[row.health.status];
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${row.clientName} · ${row.city}`}
        onPress={() => router.push(`/system/${row.systemId}`)}
        style={({ pressed }) => [styles.row, !first && styles.divider, pressed && styles.pressed]}
      >
        <HealthIcon status={row.health.status} size={28} />
        <View style={styles.fill}>
          <View style={styles.nameRow}>
            <Txt variant="label">
              {row.clientName} · {row.city}
            </Txt>
            {row.isNew && (
              <View style={styles.newBadge}>
                <Txt variant="xs" color="forest">
                  {HOME_STRINGS.newBadge}
                </Txt>
              </View>
            )}
          </View>
          {row.health.status !== 'ok' && (
            <Txt variant="small">
              <Txt variant="small" color={visual.ink}>
                {HEALTH_LABEL[row.health.status]}
              </Txt>
              {row.health.reason !== null ? ` · ${row.health.reason}` : null}
            </Txt>
          )}
        </View>
        <Icon name="chevron-right" color="textMuted" />
      </Pressable>
    );
  }

  if (item.kind === 'outage') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={outageTitle(item.group)}
        onPress={onToggleOutage}
        style={({ pressed }) => [styles.row, styles.grouped, pressed && styles.pressed]}
      >
        <Icon name="cloud-off" color="offlineText" size={28} />
        <View style={styles.fill}>
          <Txt variant="strong">{outageTitle(item.group)}</Txt>
          <Txt variant="small" color="offlineText">
            {outageDetail(item.group)}
          </Txt>
        </View>
        <Icon name={item.expanded ? 'expand-less' : 'expand-more'} color="textMuted" />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={okGroupLabel(item.count)}
      onPress={onToggleOk}
      style={({ pressed }) => [styles.row, !first && styles.divider, pressed && styles.pressed]}
    >
      <Icon name="check-circle" color="teal" size={28} />
      <Txt variant="strong" style={styles.fill}>
        {okGroupLabel(item.count)}
      </Txt>
      <Icon name={item.expanded ? 'expand-less' : 'expand-more'} color="textMuted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
  },
  divider: { borderTopWidth: 1, borderTopColor: theme.colors.line },
  pressed: { opacity: 0.7 },
  fill: { flex: 1, gap: theme.spacing.xxs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  newBadge: {
    backgroundColor: theme.colors.yellow,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 1,
  },
  grouped: {
    backgroundColor: theme.colors.offlineBg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.offline,
    borderRadius: theme.radius.sm,
    margin: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
});
