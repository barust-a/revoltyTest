import { describe, expect, it } from 'vitest';

import { generateMeasures, lastMeasureAt, SLOT_MS } from './measures';
import type { MeasureProfile } from './measures';
import { addDays, dayStartIso } from './time';
import type { Measure } from './types';
import {
  classifyGaps,
  dailySummary,
  dayStrip,
  daySlots,
  dayVerdict,
  detectAnomalyStart,
} from './energy';

function makeProfile(overrides: Partial<MeasureProfile> = {}): MeasureProfile {
  return {
    systemId: 'sys-1',
    seed: 'sys-1',
    pilotMode: 'autoconsommation',
    ...overrides,
  };
}

function until(dayKey: string, days: number): string {
  return dayStartIso(addDays(dayKey, days));
}

describe('dailySummary', () => {
  it('sums a full normal day into positive kWh figures with numeric ratios', () => {
    const profile = makeProfile();
    const measures = generateMeasures(profile, '2026-09-20', until('2026-09-20', 1));
    const summary = dailySummary(measures, '2026-09-20');
    expect(summary.producedKwh).toBeGreaterThan(0);
    expect(summary.consumedKwh).toBeGreaterThan(0);
    expect(summary.incomplete).toBe(false);
    expect(summary.selfSufficiencyPct).not.toBeNull();
    expect(summary.selfConsumptionPct).not.toBeNull();
    expect(summary.selfSufficiencyPct).toBeGreaterThanOrEqual(0);
    expect(summary.selfSufficiencyPct).toBeLessThanOrEqual(100);
    expect(summary.selfConsumptionPct).toBeGreaterThanOrEqual(0);
    expect(summary.selfConsumptionPct).toBeLessThanOrEqual(100);
  });

  it('marks a day with a lost window incomplete, with null ratios and depressed but positive production', () => {
    const dayStart = dayStartIso('2026-09-20');
    const from = new Date(new Date(dayStart).getTime() + 10 * 60 * 60 * 1000).toISOString(); // 12h local
    const to = new Date(new Date(dayStart).getTime() + 12 * 60 * 60 * 1000).toISOString(); // 14h local
    const cleanProfile = makeProfile();
    const gappyProfile = makeProfile({ lostWindows: [{ from, to }] });
    const cleanMeasures = generateMeasures(cleanProfile, '2026-09-20', until('2026-09-20', 1));
    const gappyMeasures = generateMeasures(gappyProfile, '2026-09-20', until('2026-09-20', 1));
    const cleanSummary = dailySummary(cleanMeasures, '2026-09-20');
    const gappySummary = dailySummary(gappyMeasures, '2026-09-20');
    expect(gappySummary.incomplete).toBe(true);
    expect(gappySummary.selfSufficiencyPct).toBeNull();
    expect(gappySummary.selfConsumptionPct).toBeNull();
    expect(gappySummary.producedKwh).toBeGreaterThan(0);
    expect(gappySummary.producedKwh).toBeLessThan(cleanSummary.producedKwh);
  });

  it('returns insufficient coverage (0) and no sums for an empty day', () => {
    const summary = dailySummary([], '2026-09-20');
    expect(summary.elapsedSlots).toBe(0);
    expect(summary.coverage).toBe(0);
    expect(summary.producedKwh).toBe(0);
    expect(summary.socMin).toBeNull();
    expect(summary.socMax).toBeNull();
  });
});

describe('daySlots', () => {
  it('masks the first valid slot right after a gap, leaving the next one normal', () => {
    const dayStart = dayStartIso('2026-09-20');
    const from = new Date(new Date(dayStart).getTime() + 10 * 60 * 60 * 1000).toISOString();
    const to = new Date(new Date(dayStart).getTime() + 12 * 60 * 60 * 1000).toISOString();
    const profile = makeProfile({ lostWindows: [{ from, to }] });
    const measures = generateMeasures(profile, '2026-09-20', until('2026-09-20', 1));
    const slots = daySlots(measures, '2026-09-20');
    const lastGapIdx = slots.findIndex(
      (s) => s.at === new Date(new Date(to).getTime() - SLOT_MS).toISOString(),
    );
    expect(slots[lastGapIdx]?.state).toBe('gap');
    expect(slots[lastGapIdx + 1]?.state).toBe('gap');
    expect(slots[lastGapIdx + 1]?.productionW).toBeNull();
    expect(slots[lastGapIdx + 2]?.state).toBe('ok');
    expect(slots[lastGapIdx + 2]?.productionW).not.toBeNull();
  });

  it('marks slots with no row as future', () => {
    const profile = makeProfile();
    const oneSlotUntil = new Date(
      new Date(dayStartIso('2026-09-20')).getTime() + SLOT_MS,
    ).toISOString();
    const measures = generateMeasures(profile, '2026-09-20', oneSlotUntil); // only 1 slot
    const slots = daySlots(measures, '2026-09-20');
    expect(slots).toHaveLength(96);
    expect(slots[0]?.state).toBe('ok');
    expect(slots[1]?.state).toBe('future');
    expect(slots[95]?.state).toBe('future');
  });
});

describe('classifyGaps', () => {
  it('classifies a mid-day lost window as perdues (more data arrives after it)', () => {
    const dayStart = dayStartIso('2026-09-20');
    const from = new Date(new Date(dayStart).getTime() + 10 * 60 * 60 * 1000).toISOString();
    const to = new Date(new Date(dayStart).getTime() + 12 * 60 * 60 * 1000).toISOString();
    const profile = makeProfile({ lostWindows: [{ from, to }] });
    const measures = generateMeasures(profile, '2026-09-20', until('2026-09-20', 1));
    const gaps = classifyGaps(measures, lastMeasureAt(measures));
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.kind).toBe('perdues');
    expect(gaps[0]?.from).toBe(from);
    expect(gaps[0]?.to).toBe(to);
  });

  it('classifies a trailing silent window as attente (still waiting for data)', () => {
    const silentFrom = new Date(
      new Date(dayStartIso('2026-09-20')).getTime() + 18 * 60 * 60 * 1000,
    ).toISOString();
    const profile = makeProfile({ silentFrom });
    const measures = generateMeasures(profile, '2026-09-20', until('2026-09-20', 1));
    const gaps = classifyGaps(measures, lastMeasureAt(measures));
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.kind).toBe('attente');
    expect(gaps[0]?.from).toBe(silentFrom);
  });
});

describe('dayVerdict', () => {
  it('is insuffisant for a day with no measures', () => {
    const verdict = dayVerdict([], '2026-09-20', 'autoconsommation');
    expect(verdict.kind).toBe('insuffisant');
  });

  it('is normal with the "Peu de soleil" detail when production never exceeds consumption', () => {
    const measures: Measure[] = [];
    const dayStart = dayStartIso('2026-09-20');
    for (let i = 0; i < 96; i++) {
      const at = new Date(new Date(dayStart).getTime() + i * SLOT_MS).toISOString();
      measures.push({
        systemId: 'sys-1',
        at,
        productionW: 100,
        consumptionW: 500,
        batteryW: -100,
        gridW: 500,
        socPct: 20,
      });
    }
    const verdict = dayVerdict(measures, '2026-09-20', 'autoconsommation');
    expect(verdict.kind).toBe('normal');
    expect(verdict.detail).toBe('Peu de soleil : pas de surplus à stocker.');
  });

  it('is not anormal when a day only has a small gap but is otherwise normal', () => {
    const dayStart = dayStartIso('2026-09-20');
    const from = new Date(new Date(dayStart).getTime() + 2 * 60 * 60 * 1000).toISOString();
    const to = new Date(new Date(dayStart).getTime() + 2.25 * 60 * 60 * 1000).toISOString();
    const profile = makeProfile({ lostWindows: [{ from, to }] });
    const measures = generateMeasures(profile, '2026-09-20', until('2026-09-20', 1));
    const verdict = dayVerdict(measures, '2026-09-20', 'autoconsommation');
    expect(verdict.kind).not.toBe('anormal');
  });

  it('is anormal from brokenFrom onward, and detectAnomalyStart walks back to its day', () => {
    const profile = makeProfile({ brokenFrom: '2026-09-21T04:00:00Z' });
    const measures = generateMeasures(profile, '2026-09-10', '2026-09-24T13:00:00Z');
    const verdict = dayVerdict(measures, '2026-09-23', 'autoconsommation');
    expect(verdict.kind).toBe('anormal');
    expect(detectAnomalyStart(measures, '2026-09-23', 'autoconsommation')).toBe('2026-09-21');
  });

  it('is normal the day before the battery breaks', () => {
    const profile = makeProfile({ brokenFrom: '2026-09-21T04:00:00Z' });
    const measures = generateMeasures(profile, '2026-09-10', '2026-09-24T13:00:00Z');
    const verdict = dayVerdict(measures, '2026-09-20', 'autoconsommation');
    expect(verdict.kind).toBe('normal');
  });

  it('is normal for a heures_creuses profile without a fault', () => {
    const profile = makeProfile({ pilotMode: 'heures_creuses' });
    const measures = generateMeasures(profile, '2026-09-10', '2026-09-24T13:00:00Z');
    const verdict = dayVerdict(measures, '2026-09-23', 'heures_creuses');
    expect(verdict.kind).toBe('normal');
  });
});

describe('detectAnomalyStart', () => {
  it('returns null when the day is not anormal', () => {
    const profile = makeProfile();
    const measures = generateMeasures(profile, '2026-09-10', '2026-09-24T13:00:00Z');
    expect(detectAnomalyStart(measures, '2026-09-20', 'autoconsommation')).toBeNull();
  });
});

describe('dayStrip', () => {
  it('returns 8 days ending at lastDayKey with dow and dayNum', () => {
    const profile = makeProfile();
    const measures = generateMeasures(profile, '2026-09-10', until('2026-09-24', 1));
    const strip = dayStrip(measures, '2026-09-24', 'autoconsommation');
    expect(strip).toHaveLength(8);
    expect(strip[7]?.dayKey).toBe('2026-09-24');
    expect(strip[0]?.dayKey).toBe('2026-09-17');
    for (const d of strip) {
      expect(d.dow.length).toBeGreaterThan(0);
      expect(d.dayNum).toBeGreaterThanOrEqual(1);
      expect(d.dayNum).toBeLessThanOrEqual(31);
    }
  });
});

describe('sanity', () => {
  it('prints dailySummary for 2026-09-20 and 2026-09-23 on the broken profile', () => {
    const profile = makeProfile({ brokenFrom: '2026-09-21T04:00:00Z' });
    const measures = generateMeasures(profile, '2026-09-10', '2026-09-24T13:00:00Z');
    console.log('2026-09-20', dailySummary(measures, '2026-09-20'));
    console.log('2026-09-23', dailySummary(measures, '2026-09-23'));
  });
});
