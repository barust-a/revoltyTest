import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { StripDay } from '../../core/energy';
import { Button } from '../../ui/Button';
import { theme } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import { DATA_STRINGS } from './strings';
import { stripBarHeights } from './dataView';

const STRIP_MIN_HEIGHT = 72;

function DayColumn({
  day,
  selected,
  chargePx,
  dischargePx,
  onSelect,
}: {
  day: StripDay;
  selected: boolean;
  chargePx: number;
  dischargePx: number;
  onSelect: () => void;
}) {
  const label = `${day.dow} ${day.dayNum}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.day,
        selected && styles.daySelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.flagRow}>
        {day.abnormal && <Icon name="warning" size={16} color="warning" />}
        {day.hasGap && <Icon name="cloud-off" size={16} color="offlineText" />}
      </View>
      <View style={styles.bars}>
        <View style={styles.barUpWrap}>
          <View style={[styles.bar, { height: chargePx, backgroundColor: theme.colors.primary }]} />
        </View>
        <View style={styles.barDownWrap}>
          <View style={[styles.bar, { height: dischargePx, backgroundColor: theme.colors.teal }]} />
        </View>
      </View>
      <Txt variant="xs" color={selected ? 'white' : 'textMuted'}>
        {day.dow}
      </Txt>
      <Txt variant="strong" color={selected ? 'white' : 'forest'} numeric>
        {day.dayNum}
      </Txt>
    </Pressable>
  );
}

export function DayStrip({
  days,
  selectedDayKey,
  onSelect,
  anomalySinceLabel,
  onPreviousWeek,
  onNextWeek,
  canGoPrevious,
  canGoNext,
}: {
  days: StripDay[];
  selectedDayKey: string;
  onSelect: (dayKey: string) => void;
  anomalySinceLabel: string | null;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}) {
  const bars = stripBarHeights(days);
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Txt variant="h3" style={styles.title}>
          {DATA_STRINGS.stripTitle}
        </Txt>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: theme.colors.primary }]} />
            <Txt variant="small">{DATA_STRINGS.kpiCharged}</Txt>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: theme.colors.teal }]} />
            <Txt variant="small">{DATA_STRINGS.kpiDischarged}</Txt>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        {days.map((day, i) => (
          <DayColumn
            key={day.dayKey}
            day={day}
            selected={day.dayKey === selectedDayKey}
            chargePx={bars[i]?.chargePx ?? 0}
            dischargePx={bars[i]?.dischargePx ?? 0}
            onSelect={() => onSelect(day.dayKey)}
          />
        ))}
      </View>

      {anomalySinceLabel !== null && (
        <View style={styles.since}>
          <Icon name="warning" size={20} color="warning" />
          <Txt variant="strong" color="warning">
            {anomalySinceLabel}
          </Txt>
        </View>
      )}

      <View style={styles.nav}>
        <View style={styles.navButton}>
          <Button
            label={DATA_STRINGS.previousWeek}
            icon="chevron-left"
            variant="secondary"
            onPress={onPreviousWeek}
            disabled={!canGoPrevious}
            block
          />
        </View>
        <View style={styles.navButton}>
          <Button
            label={DATA_STRINGS.nextWeek}
            icon="chevron-right"
            variant="secondary"
            onPress={onNextWeek}
            disabled={!canGoNext}
            block
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadow,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  title: { flexShrink: 1 },
  legend: { flexDirection: 'row', gap: theme.spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  swatch: { width: 12, height: 8, borderRadius: 2 },
  row: { flexDirection: 'row', gap: theme.spacing.xxs },
  day: {
    flex: 1,
    minHeight: STRIP_MIN_HEIGHT,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xxs,
    paddingVertical: theme.spacing.xs,
  },
  daySelected: { backgroundColor: theme.colors.teal },
  pressed: { opacity: 0.8 },
  flagRow: { flexDirection: 'row', height: 16, gap: 2 },
  bars: { height: theme.touch.min, width: 18, flexDirection: 'column' },
  barUpWrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  barDownWrap: { flex: 1, justifyContent: 'flex-start', alignItems: 'center' },
  bar: { width: 10, borderRadius: 3 },
  since: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  nav: { flexDirection: 'row', gap: theme.spacing.md },
  navButton: { flex: 1 },
});
