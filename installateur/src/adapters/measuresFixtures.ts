import { generateMeasures, SLOT_MS } from '../core/measures';
import type { Measure } from '../core/types';
import type { MeasuresPort } from '../ports/domain';
import { profileFor } from './fixtures';

// Generating 30 days × 96 slots is cheap but not free: memoize per system and 15-min slot.
export function createFixtureMeasures(): MeasuresPort {
  const cache = new Map<string, Measure[]>();
  return {
    forSystem(system, fromDayKey, untilIso) {
      const until = new Date(
        Math.floor(new Date(untilIso).getTime() / SLOT_MS) * SLOT_MS,
      ).toISOString();
      const key = [system.id, system.pilotMode, system.lastMeasureAt, fromDayKey, until].join('|');
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const measures = generateMeasures(profileFor(system), fromDayKey, until);
      cache.set(key, measures);
      return measures;
    },
  };
}
