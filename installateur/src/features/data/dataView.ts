// Pure presentation math for the data screen: scales, SVG paths, cursor mapping and labels.
// Kept free of React/react-native so it can be unit-tested with vitest (spec §3.4 C).
import { area, line } from 'd3-shape';

import {
  classifyGaps,
  dailySummary,
  daySlots,
  dayVerdict,
  type DaySlot,
  type Gap,
  type GapKind,
  type Verdict,
  type VerdictKind,
} from '../../core/energy';
import { BATTERY_MAX_W, SLOTS_PER_DAY } from '../../core/measures';
import { addDays, formatClock, formatDayShort, HOUR, localDayKey } from '../../core/time';
import type { Measure, PilotMode } from '../../core/types';
import type { IconName } from '../../ui/Txt';
import { DATA_STRINGS } from './strings';

// ---------- Time axis (x) ----------

export function slotCenterX(index: number, width: number): number {
  return ((index + 0.5) / SLOTS_PER_DAY) * width;
}

export function slotEdgeX(index: number, width: number): number {
  return (index / SLOTS_PER_DAY) * width;
}

// A tap position maps back to the 15-min slot it landed on (13/24 of the width -> slot 52).
export function slotIndexAtX(x: number, width: number): number {
  if (width <= 0) return 0;
  const index = Math.floor((x / width) * SLOTS_PER_DAY);
  return Math.min(SLOTS_PER_DAY - 1, Math.max(0, index));
}

// ---------- Chart geometry (fixed pixel layout, only the width scales with the device) ----------

export const ENERGY_CHART_HEIGHT = 130;
export const ENERGY_ZERO_Y = 124;
export const ENERGY_GRID_Y = 68;
const ENERGY_MAX_KW = 5;
const ENERGY_PLOT_HEIGHT = 112;

export const BATTERY_CHART_HEIGHT = 100;
export const BATTERY_ZERO_Y = 50;
const BATTERY_MAX_KW = BATTERY_MAX_W / 1000;
const BATTERY_BAR_MAX_HEIGHT = 44;

export const SOC_CHART_HEIGHT = 70;
export const SOC_ZERO_Y = 64;
export const SOC_FULL_Y = 6;
const SOC_PLOT_HEIGHT = 58;

export function energyY(kw: number): number {
  return ENERGY_ZERO_Y - (Math.max(0, kw) / ENERGY_MAX_KW) * ENERGY_PLOT_HEIGHT;
}

export function socY(pct: number): number {
  return SOC_ZERO_Y - (pct / 100) * SOC_PLOT_HEIGHT;
}

// ---------- Number & duration formatting ----------

// "3,1" — French decimal comma, 1 decimal by default.
export function frenchNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

export function formatKw(watts: number, decimals = 1): string {
  return `${frenchNumber(watts / 1000, decimals)} ${DATA_STRINGS.unitKw}`;
}

export function formatBatteryKw(batteryW: number): string {
  const kw = batteryW / 1000;
  if (kw > 0.03) return `charge ${frenchNumber(kw)} ${DATA_STRINGS.unitKw}`;
  if (kw < -0.03) return `décharge ${frenchNumber(-kw)} ${DATA_STRINGS.unitKw}`;
  return `${frenchNumber(0)} ${DATA_STRINGS.unitKw}`;
}

export function formatPercent(value: number | null): string {
  return value === null ? DATA_STRINGS.noValue : `${Math.round(value)} ${DATA_STRINGS.percentUnit}`;
}

// ---------- Chart series (d3-shape: .defined() splits the path around gaps, never a false zero) ----------

type Point = { x: number; slot: DaySlot };

function toPoints(slots: DaySlot[], width: number): Point[] {
  return slots.map((slot, i) => ({ x: slotCenterX(i, width), slot }));
}

const isOk = (p: Point) => p.slot.state === 'ok';
const prodKw = (p: Point) => (p.slot.productionW ?? 0) / 1000;
const consKw = (p: Point) => (p.slot.consumptionW ?? 0) / 1000;
const socPct = (p: Point) => p.slot.socPct ?? 0;

export type EnergyPaths = { productionPath: string; consumptionPath: string; surplusPath: string };

export function buildEnergyPaths(slots: DaySlot[], width: number): EnergyPaths {
  const points = toPoints(slots, width);

  const productionArea = area<Point>()
    .defined(isOk)
    .x((p) => p.x)
    .y0(energyY(0))
    .y1((p) => energyY(prodKw(p)));
  const consumptionLine = line<Point>()
    .defined(isOk)
    .x((p) => p.x)
    .y((p) => energyY(consKw(p)));
  const surplusArea = area<Point>()
    .defined((p) => isOk(p) && prodKw(p) > consKw(p))
    .x((p) => p.x)
    .y0((p) => energyY(consKw(p)))
    .y1((p) => energyY(prodKw(p)));

  return {
    productionPath: productionArea(points) ?? '',
    consumptionPath: consumptionLine(points) ?? '',
    surplusPath: surplusArea(points) ?? '',
  };
}

export type SocPaths = { areaPath: string; linePath: string };

export function buildSocPaths(slots: DaySlot[], width: number): SocPaths {
  const points = toPoints(slots, width);
  const socArea = area<Point>()
    .defined(isOk)
    .x((p) => p.x)
    .y0(socY(0))
    .y1((p) => socY(socPct(p)));
  const socLine = line<Point>()
    .defined(isOk)
    .x((p) => p.x)
    .y((p) => socY(socPct(p)));

  return { areaPath: socArea(points) ?? '', linePath: socLine(points) ?? '' };
}

export type BatteryBars = { chargePath: string; dischargePath: string };

// Bars, not a d3-shape generator: each slot draws its own independent rectangle.
export function buildBatteryBars(slots: DaySlot[], width: number): BatteryBars {
  const barWidth = width / SLOTS_PER_DAY;
  let chargePath = '';
  let dischargePath = '';

  slots.forEach((slot, i) => {
    if (slot.state !== 'ok' || slot.batteryW === null) return;
    const kw = slot.batteryW / 1000;
    if (Math.abs(kw) < 0.03) return;
    const barHeight = Math.min(
      BATTERY_BAR_MAX_HEIGHT,
      (Math.abs(kw) / BATTERY_MAX_KW) * BATTERY_BAR_MAX_HEIGHT,
    );
    const x0 = slotEdgeX(i, width);
    const y = kw > 0 ? BATTERY_ZERO_Y - barHeight : BATTERY_ZERO_Y + barHeight;
    const segment = `M${px(x0)} ${BATTERY_ZERO_Y}V${px(y)}H${px(x0 + barWidth)}V${BATTERY_ZERO_Y}Z`;
    if (kw > 0) chargePath += segment;
    else dischargePath += segment;
  });

  return { chargePath, dischargePath };
}

function px(v: number): string {
  return v.toFixed(1);
}

// ---------- Data gaps: bands over the chart, never drawn as a value ----------

export type GapBand = {
  fromIndex: number;
  toIndex: number;
  kind: GapKind;
  x: number;
  width: number;
};

function gapKindAt(at: string, gaps: Gap[]): GapKind | null {
  const t = new Date(at).getTime();
  const gap = gaps.find((g) => t >= new Date(g.from).getTime() && t < new Date(g.to).getTime());
  return gap?.kind ?? null;
}

export function buildGapBands(slots: DaySlot[], gaps: Gap[], width: number): GapBand[] {
  const bands: GapBand[] = [];
  let start = -1;
  let kind: GapKind | null = null;

  const flush = (endExclusive: number) => {
    if (start < 0 || kind === null) return;
    bands.push({
      fromIndex: start,
      toIndex: endExclusive - 1,
      kind,
      x: slotEdgeX(start, width),
      width: slotEdgeX(endExclusive, width) - slotEdgeX(start, width),
    });
  };

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const k = slot !== undefined && slot.state === 'gap' ? gapKindAt(slot.at, gaps) : null;
    if (k !== kind) {
      flush(i);
      start = k === null ? -1 : i;
      kind = k;
    }
  }
  flush(slots.length);

  return bands;
}

// ---------- Cursor (tap on the shared chart area) ----------

export type CursorInfo = {
  hourLabel: string;
  productionLabel: string;
  consumptionLabel: string;
  batteryLabel: string;
  socLabel: string;
};

export function cursorInfo(slot: DaySlot): CursorInfo | null {
  if (
    slot.state !== 'ok' ||
    slot.productionW === null ||
    slot.consumptionW === null ||
    slot.batteryW === null ||
    slot.socPct === null
  ) {
    return null;
  }
  return {
    hourLabel: `${Math.floor(slot.hour)} h`,
    productionLabel: DATA_STRINGS.cursorProduction(formatKw(slot.productionW)),
    consumptionLabel: DATA_STRINGS.cursorConsumption(formatKw(slot.consumptionW)),
    batteryLabel: DATA_STRINGS.cursorBattery(formatBatteryKw(slot.batteryW)),
    socLabel: DATA_STRINGS.cursorSoc(formatPercent(slot.socPct)),
  };
}

// ---------- Day title & badge ----------

export function dayTitle(dayKey: string, now: Date): string {
  const today = localDayKey(now.toISOString());
  const yesterday = addDays(today, -1);
  const short = formatDayShort(dayKey);
  if (dayKey === today) return `${DATA_STRINGS.todayPrefix} · ${short}`;
  if (dayKey === yesterday) return `${DATA_STRINGS.yesterdayPrefix} · ${short}`;
  return short;
}

export function dayBadge(dayKey: string, now: Date, incomplete: boolean): string | null {
  if (incomplete) return DATA_STRINGS.incompleteBadge;
  if (dayKey === localDayKey(now.toISOString())) return DATA_STRINGS.inProgressBadge;
  return null;
}

// ---------- Verdict subtitle & icon ----------

export const VERDICT_ICON: Record<VerdictKind, IconName> = {
  normal: 'check-circle',
  anormal: 'trending-down',
  insuffisant: 'cloud-off',
};

export function verdictSubtitle(params: {
  verdict: Verdict;
  dayKey: string;
  now: Date;
  anomalyStartDayKey: string | null;
  waitGapStartAt: string | null;
}): string {
  const { verdict, dayKey, now, anomalyStartDayKey, waitGapStartAt } = params;
  if (verdict.kind === 'anormal') {
    return DATA_STRINGS.anomalySince(formatDayShort(anomalyStartDayKey ?? dayKey));
  }
  if (verdict.kind === 'insuffisant') {
    if (waitGapStartAt !== null) return DATA_STRINGS.waitingSince(formatClock(waitGapStartAt));
    return verdict.detail;
  }
  if (dayKey === localDayKey(now.toISOString())) return DATA_STRINGS.inProgressSubtitle;
  return verdict.detail;
}

// First "attente" (still expected) gap of the day, if any — drives the "Sans nouvelles depuis" text.
export function firstWaitGapStart(slots: DaySlot[], gaps: Gap[]): string | null {
  for (const slot of slots) {
    if (slot.state !== 'gap') continue;
    if (gapKindAt(slot.at, gaps) === 'attente') return slot.at;
  }
  return null;
}

export function lastDataShort(lastMeasureAt: string | null, now: Date): string {
  return lastMeasureAt === null ? DATA_STRINGS.noValue : formatAgoWords(lastMeasureAt, now);
}

export function lastDataLabel(lastMeasureAt: string | null, now: Date): string {
  if (lastMeasureAt === null) return DATA_STRINGS.lastDataAgo(DATA_STRINGS.noValue);
  const ago = formatAgoWords(lastMeasureAt, now);
  const ms = now.getTime() - new Date(lastMeasureAt).getTime();
  if (ms < HOUR) return DATA_STRINGS.lastDataAgo(ago);
  const dayKey = localDayKey(lastMeasureAt);
  const today = localDayKey(now.toISOString());
  const when = dayKey === today ? DATA_STRINGS.lastDataToday : formatDayShort(dayKey);
  return DATA_STRINGS.lastDataAbsolute(when, formatClock(lastMeasureAt), ago);
}

// Local copy of core's formatAgo wording (kept private: core is not to be modified/imported for UI text).
function formatAgoWords(iso: string, now: Date): string {
  const ms = Math.max(0, now.getTime() - new Date(iso).getTime());
  const MINUTE = 60_000;
  if (ms < MINUTE) return "à l'instant";
  if (ms < HOUR) return `il y a ${Math.floor(ms / MINUTE)} min`;
  const DAY = 24 * HOUR;
  if (ms < 2 * DAY) return `il y a ${Math.floor(ms / HOUR)} h`;
  return `il y a ${Math.floor(ms / DAY)} j`;
}

// ---------- Habitual charge / discharge (average of the normal days in the 7 days before today) ----------

export function habitualWindow(now: Date): string[] {
  const today = localDayKey(now.toISOString());
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 7));
}

export function habitualAverage(
  measures: Measure[],
  now: Date,
  pilotMode: PilotMode,
  metric: 'chargedKwh' | 'dischargedKwh',
): number {
  const normalDays = habitualWindow(now).filter(
    (dayKey) => dayVerdict(measures, dayKey, pilotMode).kind === 'normal',
  );
  if (normalDays.length === 0) return 0;
  const sum = normalDays.reduce((acc, dayKey) => acc + dailySummary(measures, dayKey)[metric], 0);
  return Math.round((sum / normalDays.length) * 10) / 10;
}

// ---------- 8-day strip mini bars ----------

export const STRIP_BAR_MAX_HEIGHT = 26;

export type StripBar = { chargePx: number; dischargePx: number };

export function stripBarHeights(
  days: { chargedKwh: number; dischargedKwh: number; hasGap: boolean }[],
): StripBar[] {
  const maxVal = Math.max(1, ...days.map((d) => Math.max(d.chargedKwh, d.dischargedKwh)));
  return days.map((d) => ({
    chargePx: d.hasGap ? 0 : Math.round((d.chargedKwh / maxVal) * STRIP_BAR_MAX_HEIGHT),
    dischargePx: d.hasGap ? 0 : Math.round((d.dischargedKwh / maxVal) * STRIP_BAR_MAX_HEIGHT),
  }));
}

// Re-exported so the screen can build gap bands and battery-empty note without importing core/energy directly.
export { classifyGaps, dailySummary, daySlots, dayVerdict };
export type { DaySlot, Gap, GapKind, Verdict, VerdictKind };
