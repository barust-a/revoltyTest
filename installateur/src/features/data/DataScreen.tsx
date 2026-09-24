import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';

import {
  classifyGaps,
  dailySummary,
  daySlots,
  dayStrip,
  dayVerdict,
  detectAnomalyStart,
  type VerdictKind,
} from '../../core/energy';
import { addDays, formatDayShort, localDayKey, localHour } from '../../core/time';
import { Screen, SubHeader } from '../../ui/Screen';
import { theme, type ThemeColor } from '../../ui/theme';
import { Icon, Txt } from '../../ui/Txt';
import { useAppState, useNow, useServices } from '../AppProvider';
import { BatteryChart, EnergyChart, SocChart } from './charts';
import {
  cursorInfo,
  dayBadge,
  dayTitle,
  firstWaitGapStart,
  habitualAverage,
  lastDataLabel,
  lastDataShort,
  slotIndexAtX,
  VERDICT_ICON,
  verdictSubtitle,
} from './dataView';
import { DayStrip } from './DayStrip';
import { KpiGrid } from './KpiGrid';
import { DATA_STRINGS } from './strings';

const CHART_WIDTH_FALLBACK = 340;
const MEASURES_WINDOW_DAYS = 30;
const STRIP_WEEK_STEP = 7;
const MAX_WEEK_OFFSET = Math.floor((MEASURES_WINDOW_DAYS - 8) / STRIP_WEEK_STEP);

const VERDICT_BOX: Record<
  VerdictKind,
  { bg: ThemeColor; border: ThemeColor; dashed: boolean; ink: ThemeColor }
> = {
  anormal: { bg: 'dangerBg', border: 'danger', dashed: false, ink: 'danger' },
  insuffisant: { bg: 'offlineBg', border: 'offline', dashed: true, ink: 'offlineText' },
  normal: { bg: 'card', border: 'card', dashed: false, ink: 'teal' },
};

export function DataScreen({ systemId }: { systemId: string }) {
  const services = useServices();
  const now = useNow();
  const system = useAppState((s) => s.domain.systems.find((sys) => sys.id === systemId));

  const todayKey = localDayKey(now.toISOString());
  const yesterdayKey = addDays(todayKey, -1);

  const [selectedDayKey, setSelectedDayKey] = useState(yesterdayKey);
  const [weekOffset, setWeekOffset] = useState(0);
  const [cursorIndex, setCursorIndex] = useState<number | null>(null);
  const [chartWidth, setChartWidth] = useState(CHART_WIDTH_FALLBACK);

  if (system === undefined) return null;

  // The adapter memoizes per (system, pilotMode, lastMeasureAt, window): cheap to call on every render.
  const measures = services.measures.forSystem(
    system,
    addDays(todayKey, -MEASURES_WINDOW_DAYS),
    now.toISOString(),
  );

  const gaps = classifyGaps(measures, system.lastMeasureAt);
  const slots = daySlots(measures, selectedDayKey);
  const figures = dailySummary(measures, selectedDayKey);
  const verdict = dayVerdict(measures, selectedDayKey, system.pilotMode);
  const anomalyStartForSelected =
    verdict.kind === 'anormal'
      ? detectAnomalyStart(measures, selectedDayKey, system.pilotMode)
      : null;
  const waitGapStartAt = verdict.kind === 'insuffisant' ? firstWaitGapStart(slots, gaps) : null;

  const subtitle = verdictSubtitle({
    verdict,
    dayKey: selectedDayKey,
    now,
    anomalyStartDayKey: anomalyStartForSelected,
    waitGapStartAt,
  });

  const stripEndDayKey = addDays(todayKey, -STRIP_WEEK_STEP * weekOffset);
  const stripDays = dayStrip(measures, stripEndDayKey, system.pilotMode, 8);
  const overallAnomalyStart = detectAnomalyStart(measures, yesterdayKey, system.pilotMode);
  const anomalySinceLabel =
    overallAnomalyStart === null
      ? null
      : DATA_STRINGS.anomalySince(formatDayShort(overallAnomalyStart));

  const habitualChargedKwh = habitualAverage(measures, now, system.pilotMode, 'chargedKwh');
  const habitualDischargedKwh = habitualAverage(measures, now, system.pilotMode, 'dischargedKwh');
  const batteryEmpty = verdict.kind === 'anormal' && figures.chargedKwh < 0.05;

  const nowIndex =
    selectedDayKey === todayKey ? Math.min(95, Math.floor(localHour(now.toISOString()) * 4)) : null;
  const cursorSlot = cursorIndex === null ? undefined : slots[cursorIndex];
  const cursor = cursorSlot === undefined ? null : cursorInfo(cursorSlot);

  const hasWaitGap = gaps.some((g) => g.kind === 'attente');
  const hasLostGap = gaps.some((g) => g.kind === 'perdues');

  const box = VERDICT_BOX[verdict.kind];
  const badge = dayBadge(selectedDayKey, now, figures.incomplete);

  function selectDay(dayKey: string) {
    setSelectedDayKey(dayKey);
    setCursorIndex(null);
  }

  function onChartPress(event: GestureResponderEvent) {
    setCursorIndex(slotIndexAtX(event.nativeEvent.locationX, chartWidth));
  }

  function onChartLayout(event: LayoutChangeEvent) {
    setChartWidth(event.nativeEvent.layout.width);
  }

  return (
    <Screen
      header={
        <SubHeader
          backLabel={system.client.name}
          onBack={() => router.back()}
          title={DATA_STRINGS.title}
        />
      }
    >
      <View
        style={[
          styles.verdictCard,
          { backgroundColor: theme.colors[box.bg], borderColor: theme.colors[box.border] },
          box.dashed && styles.dashed,
        ]}
      >
        <Icon name={VERDICT_ICON[verdict.kind]} size={28} color={box.ink} />
        <View style={styles.fill}>
          <Txt variant="label" color={box.ink}>
            {verdict.title}
          </Txt>
          <Txt variant="body">{subtitle}</Txt>
          <Txt variant="small" color="textMuted">
            {lastDataLabel(system.lastMeasureAt, now)}
          </Txt>
        </View>
      </View>

      <View style={styles.dayTitleRow}>
        <Txt variant="h2">{dayTitle(selectedDayKey, now)}</Txt>
        {badge !== null && (
          <View style={styles.badge}>
            <Txt variant="xs" color="offlineText">
              {badge}
            </Txt>
          </View>
        )}
      </View>

      <View style={styles.chartCard}>
        {cursor !== null && (
          <View style={styles.cursorBox}>
            <Txt variant="strong" color="white">
              {cursor.hourLabel}
            </Txt>
            <Txt variant="small" color="white">
              {cursor.productionLabel} · {cursor.consumptionLabel}
            </Txt>
            <Txt variant="small" color="white">
              {cursor.batteryLabel} · {cursor.socLabel}
            </Txt>
          </View>
        )}

        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel="Curseur horaire des graphes"
          onPress={onChartPress}
          onLayout={onChartLayout}
        >
          <View style={styles.chartHeaderRow}>
            <Txt variant="small" style={styles.chartTitleText}>
              {DATA_STRINGS.energyChartTitle}
            </Txt>
            <Txt variant="xs" color="textMuted">
              {DATA_STRINGS.unitKw}
            </Txt>
          </View>
          <View style={styles.legend}>
            <LegendItem color="solar" label={DATA_STRINGS.legendProduction} />
            <LegendItem color="forest" label={DATA_STRINGS.legendConsumption} />
            <LegendItem color="solar" label={DATA_STRINGS.legendSurplus} hatched />
            {hasWaitGap && <LegendItem color="offline" label={DATA_STRINGS.legendWait} hatched />}
            {hasLostGap && <LegendItem color="offline" label={DATA_STRINGS.legendLost} hatched />}
          </View>
          <EnergyChart
            slots={slots}
            gaps={gaps}
            width={chartWidth}
            cursorIndex={cursorIndex}
            nowIndex={nowIndex}
          />

          <View style={styles.chartHeaderRow}>
            <Txt variant="small" style={styles.chartTitleText}>
              {DATA_STRINGS.batteryChartTitle}
            </Txt>
            <View style={styles.legend}>
              <LegendItem color="primary" label={DATA_STRINGS.batteryAxisCharge} />
              <LegendItem color="teal" label={DATA_STRINGS.batteryAxisDischarge} />
            </View>
          </View>
          {batteryEmpty && (
            <Txt variant="small" color="danger" style={styles.batteryNote}>
              {DATA_STRINGS.batteryEmptyNote}
            </Txt>
          )}
          <BatteryChart
            slots={slots}
            gaps={gaps}
            width={chartWidth}
            cursorIndex={cursorIndex}
            nowIndex={nowIndex}
          />

          <View style={styles.chartHeaderRow}>
            <Txt variant="small" style={styles.chartTitleText}>
              {DATA_STRINGS.socChartTitle}
            </Txt>
            <Txt variant="xs" color="textMuted">
              {DATA_STRINGS.socUnit}
            </Txt>
          </View>
          <SocChart
            slots={slots}
            gaps={gaps}
            width={chartWidth}
            cursorIndex={cursorIndex}
            nowIndex={nowIndex}
          />

          <View style={styles.axisRow}>
            {DATA_STRINGS.axisHours.map((label) => (
              <Txt key={label} variant="xs" color="textMuted">
                {label}
              </Txt>
            ))}
          </View>
        </Pressable>
      </View>

      <KpiGrid
        figures={figures}
        habitualChargedKwh={habitualChargedKwh}
        habitualDischargedKwh={habitualDischargedKwh}
        dayAbnormal={verdict.kind === 'anormal'}
        lastDataShort={lastDataShort(system.lastMeasureAt, now)}
      />

      <DayStrip
        days={stripDays}
        selectedDayKey={selectedDayKey}
        onSelect={selectDay}
        anomalySinceLabel={anomalySinceLabel}
        onPreviousWeek={() => setWeekOffset((w) => Math.min(MAX_WEEK_OFFSET, w + 1))}
        onNextWeek={() => setWeekOffset((w) => Math.max(0, w - 1))}
        canGoPrevious={weekOffset < MAX_WEEK_OFFSET}
        canGoNext={weekOffset > 0}
      />
    </Screen>
  );
}

function LegendItem({
  color,
  label,
  hatched = false,
}: {
  color: ThemeColor;
  label: string;
  hatched?: boolean;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.swatch,
          { backgroundColor: theme.colors[color] },
          hatched && styles.swatchHatched,
        ]}
      />
      <Txt variant="xs" color="textMuted">
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: theme.spacing.xxs },
  verdictCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-start',
    borderRadius: theme.radius.card,
    borderWidth: 2,
    padding: theme.spacing.lg,
  },
  dashed: { borderStyle: 'dashed' },
  dayTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: theme.spacing.sm },
  badge: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.offline,
    backgroundColor: theme.colors.offlineBg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  chartCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.card,
    paddingVertical: theme.spacing.md,
    ...theme.shadow,
  },
  cursorBox: {
    backgroundColor: theme.colors.teal,
    borderRadius: theme.radius.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    gap: 2,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  chartTitleText: { fontFamily: theme.font.bold, color: theme.colors.forest },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  swatch: { width: 14, height: 10, borderRadius: 2 },
  swatchHatched: { opacity: 0.5 },
  batteryNote: { marginBottom: theme.spacing.xs, fontFamily: theme.font.bold },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xxs },
});
