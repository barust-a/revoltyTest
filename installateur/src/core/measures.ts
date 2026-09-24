import { hash32 } from './hash';
import { dayStartIso, localDayKey, localHour, MINUTE } from './time';
import type { Measure, PilotMode } from './types';

export const SLOT_MS = 15 * MINUTE;
export const SLOTS_PER_DAY = 96;
export const BATTERY_KWH = 10;
export const BATTERY_MAX_W = 3300;

const SOC_FLOOR_DEFAULT_PCT = 5;
const SOC_FLOOR_SECOURS_PCT = 30;
const SOC_START_PCT = 30;
const SOC_BROKEN_PCT = 8;
const HC_TARGET_SOC_PCT = 60;
const HC_CHARGE_W = 2000;

export type MeasureProfile = {
  systemId: string;
  seed: string;
  pilotMode: PilotMode;
  brokenFrom?: string;
  silentFrom?: string;
  lostWindows?: { from: string; to: string }[];
};

function gauss(h: number, m: number, s: number): number {
  return Math.exp(-((h - m) * (h - m)) / (2 * s * s));
}

function productionAt(h: number, cloud: number): number {
  if (h < 7.2 || h > 19.8) return 0;
  return 4200 * cloud * Math.pow(Math.sin((Math.PI * (h - 7.2)) / 12.6), 1.4);
}

function consumptionAt(h: number, sd: number): number {
  const kw =
    0.32 +
    1.0 * gauss(h, 7.4, 0.55) +
    0.55 * gauss(h, 12.6, 0.8) +
    1.7 * gauss(h, 19.9, 1.1) +
    0.1 * Math.sin(h * 2.7 + sd) +
    0.06 * Math.sin(h * 7.3 + sd * 2);
  return Math.max(200, kw * 1000);
}

function cloudFactor(seed: string, dayKey: string): number {
  return 0.55 + 0.45 * ((hash32(seed + dayKey) % 1000) / 999);
}

function consumptionSd(seed: string, dayKey: string): number {
  return (hash32(`${seed}:c:${dayKey}`) % 100) / 10;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function isInLostWindow(
  atMs: number,
  lostWindows: { from: string; to: string }[] | undefined,
): boolean {
  if (lostWindows === undefined) return false;
  return lostWindows.some(
    (w) => atMs >= new Date(w.from).getTime() && atMs < new Date(w.to).getTime(),
  );
}

export function generateMeasures(
  profile: MeasureProfile,
  fromDayKey: string,
  untilIso: string,
): Measure[] {
  const startMs = new Date(dayStartIso(fromDayKey)).getTime();
  const untilMs = new Date(untilIso).getTime();
  const brokenFromMs =
    profile.brokenFrom !== undefined ? new Date(profile.brokenFrom).getTime() : null;
  const silentFromMs =
    profile.silentFrom !== undefined ? new Date(profile.silentFrom).getTime() : null;
  const floorPct = profile.pilotMode === 'secours' ? SOC_FLOOR_SECOURS_PCT : SOC_FLOOR_DEFAULT_PCT;

  const measures: Measure[] = [];
  let socKwh = (SOC_START_PCT / 100) * BATTERY_KWH;
  let broken = false;

  for (let i = 0; startMs + i * SLOT_MS < untilMs; i++) {
    const atMs = startMs + i * SLOT_MS;
    const at = new Date(atMs).toISOString();
    const dayKey = localDayKey(at);
    const h = localHour(at) + 0.125;

    const cloud = cloudFactor(profile.seed, dayKey);
    const sd = consumptionSd(profile.seed, dayKey);
    const productionW = productionAt(h, cloud);
    const consumptionW = consumptionAt(h, sd);

    const isBrokenNow = brokenFromMs !== null && atMs >= brokenFromMs;

    let batteryW: number;
    if (isBrokenNow) {
      if (!broken) {
        socKwh = (SOC_BROKEN_PCT / 100) * BATTERY_KWH;
        broken = true;
      }
      batteryW = 0;
    } else {
      const isHeuresCreuses =
        profile.pilotMode === 'heures_creuses' &&
        h >= 1 &&
        h < 5 &&
        (socKwh / BATTERY_KWH) * 100 < HC_TARGET_SOC_PCT;

      if (isHeuresCreuses) {
        const headroomW = (BATTERY_KWH - socKwh) * 4000;
        batteryW = Math.min(HC_CHARGE_W, BATTERY_MAX_W, headroomW);
      } else {
        const surplus = productionW - consumptionW;
        if (surplus > 0) {
          const headroomW = (BATTERY_KWH - socKwh) * 4000;
          batteryW = Math.min(surplus, BATTERY_MAX_W, headroomW);
        } else {
          const floorKwh = (floorPct / 100) * BATTERY_KWH;
          const availableW = Math.max(0, socKwh - floorKwh) * 4000;
          batteryW = -Math.min(-surplus, BATTERY_MAX_W, availableW);
        }
      }
      socKwh = Math.min(BATTERY_KWH, Math.max(0, socKwh + batteryW / 4000));
    }

    const gridW = consumptionW + batteryW - productionW;
    const socPct = (socKwh / BATTERY_KWH) * 100;

    const isSilent = silentFromMs !== null && atMs >= silentFromMs;
    const isLost = isInLostWindow(atMs, profile.lostWindows);
    const isGap = isSilent || isLost;

    measures.push({
      systemId: profile.systemId,
      at,
      productionW: isGap ? null : Math.round(productionW),
      consumptionW: isGap ? null : Math.round(consumptionW),
      batteryW: isGap ? null : Math.round(batteryW),
      gridW: isGap ? null : Math.round(gridW),
      socPct: isGap ? null : round1(socPct),
    });
  }

  return measures;
}

export function lastMeasureAt(measures: Measure[]): string | null {
  for (let i = measures.length - 1; i >= 0; i--) {
    const m = measures[i];
    if (m !== undefined && m.productionW !== null) return m.at;
  }
  return null;
}
