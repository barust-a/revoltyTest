import { describe, expect, it } from 'vitest';

import { addDays, dayStartIso } from './time';
import type { MeasureProfile } from './measures';
import { generateMeasures, lastMeasureAt, SLOTS_PER_DAY } from './measures';

function makeProfile(overrides: Partial<MeasureProfile> = {}): MeasureProfile {
  return {
    systemId: 'sys-1',
    seed: 'sys-1',
    pilotMode: 'autoconsommation',
    ...overrides,
  };
}

describe('generateMeasures', () => {
  it('is deterministic — same profile produces an identical array', () => {
    const profile = makeProfile();
    const a = generateMeasures(profile, '2026-09-20', dayStartIso('2026-09-21'));
    const b = generateMeasures(profile, '2026-09-20', dayStartIso('2026-09-21'));
    expect(a).toEqual(b);
  });

  it('returns 96 rows for a full day', () => {
    const profile = makeProfile();
    const measures = generateMeasures(profile, '2026-09-20', dayStartIso(addDays('2026-09-20', 1)));
    expect(measures).toHaveLength(SLOTS_PER_DAY);
  });

  it('stops before untilIso', () => {
    const profile = makeProfile();
    const start = dayStartIso('2026-09-20');
    const until = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString(); // +1h = 4 slots
    const measures = generateMeasures(profile, '2026-09-20', until);
    expect(measures).toHaveLength(4);
    for (const m of measures) {
      expect(new Date(m.at).getTime()).toBeLessThan(new Date(until).getTime());
    }
  });

  it('has zero production at night and positive production at 13h local', () => {
    const profile = makeProfile();
    const measures = generateMeasures(profile, '2026-09-20', dayStartIso(addDays('2026-09-20', 1)));
    const midnight = measures[0];
    const thirteen = measures[52]; // mid-slot local hour ≈ 13.125
    expect(midnight?.productionW).toBe(0);
    expect(thirteen?.productionW).toBeGreaterThan(0);
  });

  it('keeps socPct within [0, 100] for all non-null rows', () => {
    const profile = makeProfile();
    const measures = generateMeasures(profile, '2026-09-20', dayStartIso(addDays('2026-09-20', 3)));
    for (const m of measures) {
      if (m.socPct === null) continue;
      expect(m.socPct).toBeGreaterThanOrEqual(0);
      expect(m.socPct).toBeLessThanOrEqual(100);
    }
  });

  it('charges from the grid at 3h local in heures_creuses mode', () => {
    const profile = makeProfile({ pilotMode: 'heures_creuses' });
    const measures = generateMeasures(profile, '2026-09-20', dayStartIso(addDays('2026-09-20', 1)));
    const oneAm = measures[4]; // mid-slot local hour ≈ 1.125, start of the heures-creuses window
    expect(oneAm?.productionW).toBe(0);
    expect(oneAm?.batteryW).toBeGreaterThan(0);
  });

  it('freezes batteryW at 0 from brokenFrom onward', () => {
    const brokenFrom = new Date(
      new Date(dayStartIso('2026-09-20')).getTime() + 4 * 60 * 60 * 1000,
    ).toISOString();
    const profile = makeProfile({ brokenFrom });
    const measures = generateMeasures(profile, '2026-09-20', dayStartIso(addDays('2026-09-20', 1)));
    const afterBroken = measures.filter(
      (m) => new Date(m.at).getTime() >= new Date(brokenFrom).getTime(),
    );
    expect(afterBroken.length).toBeGreaterThan(0);
    for (const m of afterBroken) {
      expect(m.batteryW).toBe(0);
    }
  });

  it('nulls all numeric fields from silentFrom onward', () => {
    const silentFrom = new Date(
      new Date(dayStartIso('2026-09-20')).getTime() + 6 * 60 * 60 * 1000,
    ).toISOString();
    const profile = makeProfile({ silentFrom });
    const measures = generateMeasures(profile, '2026-09-20', dayStartIso(addDays('2026-09-20', 1)));
    const before = measures.filter(
      (m) => new Date(m.at).getTime() < new Date(silentFrom).getTime(),
    );
    const after = measures.filter(
      (m) => new Date(m.at).getTime() >= new Date(silentFrom).getTime(),
    );
    expect(before.length).toBeGreaterThan(0);
    expect(after.length).toBeGreaterThan(0);
    for (const m of after) {
      expect(m.productionW).toBeNull();
      expect(m.consumptionW).toBeNull();
      expect(m.batteryW).toBeNull();
      expect(m.gridW).toBeNull();
      expect(m.socPct).toBeNull();
    }
  });

  it('nulls all numeric fields inside lostWindows', () => {
    const dayStart = dayStartIso('2026-09-20');
    const from = new Date(new Date(dayStart).getTime() + 2 * 60 * 60 * 1000).toISOString();
    const to = new Date(new Date(dayStart).getTime() + 3 * 60 * 60 * 1000).toISOString();
    const profile = makeProfile({ lostWindows: [{ from, to }] });
    const measures = generateMeasures(profile, '2026-09-20', dayStartIso(addDays('2026-09-20', 1)));
    for (const m of measures) {
      const atMs = new Date(m.at).getTime();
      if (atMs >= new Date(from).getTime() && atMs < new Date(to).getTime()) {
        expect(m.consumptionW).toBeNull();
      } else {
        expect(m.consumptionW).not.toBeNull();
      }
    }
  });
});

describe('lastMeasureAt', () => {
  it('returns the at of the last row with non-null productionW', () => {
    const profile = makeProfile();
    const measures = generateMeasures(profile, '2026-09-20', dayStartIso(addDays('2026-09-20', 1)));
    const last = measures[measures.length - 1];
    expect(lastMeasureAt(measures)).toBe(last?.at);
  });

  it('skips trailing null rows (silentFrom)', () => {
    const silentFrom = new Date(
      new Date(dayStartIso('2026-09-20')).getTime() + 6 * 60 * 60 * 1000,
    ).toISOString();
    const profile = makeProfile({ silentFrom });
    const measures = generateMeasures(profile, '2026-09-20', dayStartIso(addDays('2026-09-20', 1)));
    const expected = measures.filter((m) => m.productionW !== null).at(-1)?.at ?? null;
    expect(lastMeasureAt(measures)).toBe(expected);
  });

  it('returns null when there are no rows', () => {
    expect(lastMeasureAt([])).toBeNull();
  });
});
