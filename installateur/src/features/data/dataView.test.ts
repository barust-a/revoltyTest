import { describe, expect, it } from 'vitest';

import { dayStartIso } from '../../core/time';
import type { Measure } from '../../core/types';
import {
  buildEnergyPaths,
  buildGapBands,
  classifyGaps,
  daySlots,
  dayBadge,
  dayTitle,
  habitualAverage,
  slotIndexAtX,
} from './dataView';

const SLOT_MS = 15 * 60 * 1000;
const NOW = new Date('2026-09-24T13:00:00Z'); // 15:00 Lyon, matches the demo "now" (spec §3.7)

function makeDayMeasures(dayKey: string, gapRange?: [number, number]): Measure[] {
  const start = new Date(dayStartIso(dayKey)).getTime();
  const measures: Measure[] = [];
  for (let i = 0; i < 96; i++) {
    const at = new Date(start + i * SLOT_MS).toISOString();
    const inGap = gapRange !== undefined && i >= gapRange[0] && i < gapRange[1];
    measures.push({
      systemId: 'sys-test',
      at,
      productionW: inGap ? null : 1000 + i,
      consumptionW: inGap ? null : 500,
      batteryW: inGap ? null : 200,
      gridW: inGap ? null : -300,
      socPct: inGap ? null : 50,
    });
  }
  return measures;
}

describe('slotIndexAtX', () => {
  it('maps a tap at 13/24 of the width to slot 52', () => {
    const width = 960;
    expect(slotIndexAtX((13 / 24) * width, width)).toBe(52);
  });

  it('clamps to the chart bounds', () => {
    expect(slotIndexAtX(-10, 360)).toBe(0);
    expect(slotIndexAtX(10_000, 360)).toBe(95);
  });
});

describe('buildEnergyPaths', () => {
  it('never draws a gap as a zero: the path breaks into several subpaths', () => {
    const measures = makeDayMeasures('2026-09-23', [40, 50]);
    const slots = daySlots(measures, '2026-09-23');
    const { productionPath, consumptionPath } = buildEnergyPaths(slots, 960);

    // One run before the gap, one after: two independent "M ..." subpaths, not one continuous path.
    expect((productionPath.match(/M/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect((consumptionPath.match(/M/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('draws a single subpath when the day has no gap', () => {
    const measures = makeDayMeasures('2026-09-23');
    const slots = daySlots(measures, '2026-09-23');
    const { consumptionPath } = buildEnergyPaths(slots, 960);
    expect((consumptionPath.match(/M/g) ?? []).length).toBe(1);
  });
});

describe('buildGapBands', () => {
  it('classifies a gap after the last measure as "attente"', () => {
    const measures = makeDayMeasures('2026-09-24', [80, 96]);
    const slots = daySlots(measures, '2026-09-24');
    const lastMeasureAt = slots[79]?.at ?? null;
    const gaps = classifyGaps(measures, lastMeasureAt);
    const bands = buildGapBands(slots, gaps, 960);

    expect(bands).toHaveLength(1);
    expect(bands[0]?.kind).toBe('attente');
    expect(bands[0]?.fromIndex).toBe(80);
    expect(bands[0]?.toIndex).toBe(95);
  });

  it('classifies a gap before the last measure as "perdues"', () => {
    const measures = makeDayMeasures('2026-09-24', [20, 30]);
    const lastMeasureAt = measures[95]?.at ?? null;
    const slots = daySlots(measures, '2026-09-24');
    const gaps = classifyGaps(measures, lastMeasureAt);
    const bands = buildGapBands(slots, gaps, 960);

    expect(bands).toHaveLength(1);
    expect(bands[0]?.kind).toBe('perdues');
  });
});

describe('habitualAverage', () => {
  it('averages the charged energy of the normal days in the window before today', () => {
    const today = '2026-09-24';
    const days = Array.from({ length: 7 }, (_, i) => `2026-09-${17 + i}`);
    const measures = days.flatMap((d) => makeDayMeasures(d));
    const avg = habitualAverage(
      measures,
      new Date(dayStartIso(today)),
      'autoconsommation',
      'chargedKwh',
    );
    // Constant 200 W charge over 96 slots of 15 min = 4.8 kWh/day, identical every day.
    expect(avg).toBe(4.8);
  });

  it('returns 0 when there is no data for the window', () => {
    const avg = habitualAverage([], NOW, 'autoconsommation', 'chargedKwh');
    expect(avg).toBe(0);
  });
});

describe('dayTitle', () => {
  it('labels today, yesterday and older days', () => {
    expect(dayTitle('2026-09-24', NOW)).toBe("Aujourd'hui · jeu. 24 sept.");
    expect(dayTitle('2026-09-23', NOW)).toBe('Hier · mer. 23 sept.');
    expect(dayTitle('2026-09-21', NOW)).toBe('lun. 21 sept.');
  });
});

describe('dayBadge', () => {
  it('prefers "incomplet" over "en cours"', () => {
    expect(dayBadge('2026-09-24', NOW, true)).toBe('incomplet');
    expect(dayBadge('2026-09-24', NOW, false)).toBe('en cours');
    expect(dayBadge('2026-09-23', NOW, false)).toBeNull();
    expect(dayBadge('2026-09-23', NOW, true)).toBe('incomplet');
  });
});
