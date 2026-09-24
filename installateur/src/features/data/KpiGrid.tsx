import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { KeyFigures } from '../../core/energy';
import { theme } from '../../ui/theme';
import { Txt } from '../../ui/Txt';
import { formatPercent, frenchNumber } from './dataView';
import { DATA_STRINGS } from './strings';

function Kpi({
  label,
  value,
  unit,
  hint,
  hintTone,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  hintTone?: 'muted' | 'danger';
}) {
  return (
    <View style={styles.kpi}>
      <Txt variant="small" color="textMuted">
        {label}
      </Txt>
      <Txt variant="h3" numeric>
        {value}
        {unit !== undefined && (
          <Txt variant="small" color="textMuted">
            {' '}
            {unit}
          </Txt>
        )}
      </Txt>
      {hint !== undefined && (
        <Txt variant="xs" color={hintTone === 'danger' ? 'danger' : 'textMuted'}>
          {hint}
        </Txt>
      )}
    </View>
  );
}

export function KpiGrid({
  figures,
  habitualChargedKwh,
  habitualDischargedKwh,
  dayAbnormal,
  lastDataShort,
}: {
  figures: KeyFigures;
  habitualChargedKwh: number;
  habitualDischargedKwh: number;
  dayAbnormal: boolean;
  lastDataShort: string;
}) {
  return (
    <View style={styles.grid}>
      <Kpi
        label={DATA_STRINGS.kpiProduced}
        value={frenchNumber(figures.producedKwh)}
        unit={DATA_STRINGS.kwhUnit}
      />
      <Kpi
        label={DATA_STRINGS.kpiConsumed}
        value={frenchNumber(figures.consumedKwh)}
        unit={DATA_STRINGS.kwhUnit}
      />
      <Kpi
        label={DATA_STRINGS.kpiCharged}
        value={frenchNumber(figures.chargedKwh)}
        unit={DATA_STRINGS.kwhUnit}
        hint={DATA_STRINGS.habitual(frenchNumber(habitualChargedKwh))}
        hintTone={dayAbnormal ? 'danger' : 'muted'}
      />
      <Kpi
        label={DATA_STRINGS.kpiDischarged}
        value={frenchNumber(figures.dischargedKwh)}
        unit={DATA_STRINGS.kwhUnit}
        hint={DATA_STRINGS.habitual(frenchNumber(habitualDischargedKwh))}
      />
      <Kpi
        label={DATA_STRINGS.kpiSelfSufficiency}
        value={formatPercent(figures.selfSufficiencyPct)}
        hint={DATA_STRINGS.kpiSelfSufficiencyHint}
      />
      <Kpi
        label={DATA_STRINGS.kpiSelfConsumption}
        value={formatPercent(figures.selfConsumptionPct)}
        hint={DATA_STRINGS.kpiSelfConsumptionHint}
      />
      <Kpi
        label={DATA_STRINGS.kpiSocRange}
        value={`${figures.socMin === null ? DATA_STRINGS.noValue : Math.round(figures.socMin)} / ${
          figures.socMax === null ? DATA_STRINGS.noValue : Math.round(figures.socMax)
        }`}
        unit={DATA_STRINGS.percentUnit}
      />
      <Kpi label={DATA_STRINGS.kpiLastData} value={lastDataShort} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  kpi: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 84,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.xxs,
    ...theme.shadow,
  },
});
