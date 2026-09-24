import type { ClockPort } from '../ports/domain';

// The demo is frozen on Thursday 24 Sept, 15:00 in Lyon, then runs at real speed so
// time-based rules (3 s battery confirmation, "il y a 12 min") still move on screen.
export function createDemoClock(
  startIso: string,
  realNow: () => number = () => Date.now(),
): ClockPort {
  const start = new Date(startIso).getTime();
  const t0 = realNow();
  return { now: () => new Date(start + (realNow() - t0)) };
}
