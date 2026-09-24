import { SLOT_MS, SLOTS_PER_DAY } from './measures';
import { addDays, dayStartIso, formatDayShort, localDayKey, localHour } from './time';
import type { Measure, PilotMode } from './types';

export type GapKind = 'attente' | 'perdues';
export type Gap = { from: string; to: string; kind: GapKind };

export type DaySlot = {
  at: string;
  hour: number;
  productionW: number | null;
  consumptionW: number | null;
  batteryW: number | null;
  socPct: number | null;
  state: 'ok' | 'gap' | 'future';
};

export type KeyFigures = {
  producedKwh: number;
  consumedKwh: number;
  chargedKwh: number;
  dischargedKwh: number;
  selfSufficiencyPct: number | null;
  selfConsumptionPct: number | null;
  socMin: number | null;
  socMax: number | null;
  incomplete: boolean;
  coverage: number;
  elapsedSlots: number;
};

export type VerdictKind = 'normal' | 'anormal' | 'insuffisant';
export type Verdict = { kind: VerdictKind; title: string; detail: string };

export type StripDay = {
  dayKey: string;
  chargedKwh: number;
  dischargedKwh: number;
  abnormal: boolean;
  hasGap: boolean;
  dow: string;
  dayNum: number;
};

const ANOMALY_SURPLUS_KWH = 2;
const ANOMALY_SOLAR_CHARGE_KWH = 0.5;
const ANOMALY_SOC_MAX_PCT = 95;
const MIN_COVERAGE_FOR_VERDICT = 0.5;

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function makeGap(from: string, lastNullAt: string, lastMeasureAt: string | null): Gap {
  const to = new Date(new Date(lastNullAt).getTime() + SLOT_MS).toISOString();
  const kind: GapKind =
    lastMeasureAt === null || new Date(from).getTime() >= new Date(lastMeasureAt).getTime()
      ? 'attente'
      : 'perdues';
  return { from, to, kind };
}

export function classifyGaps(measures: Measure[], lastMeasureAt: string | null): Gap[] {
  const gaps: Gap[] = [];
  let runStart: string | null = null;
  let runEnd: string | null = null;
  for (const m of measures) {
    if (m.productionW === null) {
      runStart ??= m.at;
      runEnd = m.at;
    } else if (runStart !== null && runEnd !== null) {
      gaps.push(makeGap(runStart, runEnd, lastMeasureAt));
      runStart = null;
      runEnd = null;
    }
  }
  if (runStart !== null && runEnd !== null) {
    gaps.push(makeGap(runStart, runEnd, lastMeasureAt));
  }
  return gaps;
}

export function daySlots(measures: Measure[], dayKey: string): DaySlot[] {
  const byAt = new Map(measures.map((m) => [m.at, m]));
  const dayStartMs = new Date(dayStartIso(dayKey)).getTime();
  const slots: DaySlot[] = [];
  let inGapRun = false;

  for (let i = 0; i < SLOTS_PER_DAY; i++) {
    const at = new Date(dayStartMs + i * SLOT_MS).toISOString();
    const hour = localHour(at);
    const m = byAt.get(at);

    if (m === undefined) {
      slots.push({
        at,
        hour,
        productionW: null,
        consumptionW: null,
        batteryW: null,
        socPct: null,
        state: 'future',
      });
      continue;
    }

    if (m.productionW === null) {
      slots.push({
        at,
        hour,
        productionW: null,
        consumptionW: null,
        batteryW: null,
        socPct: null,
        state: 'gap',
      });
      inGapRun = true;
      continue;
    }

    if (inGapRun) {
      slots.push({
        at,
        hour,
        productionW: null,
        consumptionW: null,
        batteryW: null,
        socPct: null,
        state: 'gap',
      });
      inGapRun = false;
      continue;
    }

    slots.push({
      at,
      hour,
      productionW: m.productionW,
      consumptionW: m.consumptionW,
      batteryW: m.batteryW,
      socPct: m.socPct,
      state: 'ok',
    });
  }

  return slots;
}

export function dailySummary(measures: Measure[], dayKey: string): KeyFigures {
  const slots = daySlots(measures, dayKey);

  let producedKwh = 0;
  let consumedKwh = 0;
  let chargedKwh = 0;
  let dischargedKwh = 0;
  let importKwh = 0;
  let exportKwh = 0;
  let socMin: number | null = null;
  let socMax: number | null = null;
  let elapsedSlots = 0;
  let okSlots = 0;
  let incomplete = false;

  for (const s of slots) {
    if (s.state === 'future') continue;
    elapsedSlots++;
    if (s.state === 'gap') {
      incomplete = true;
      continue;
    }
    const { productionW: p, consumptionW: c, batteryW: b, socPct: soc } = s;
    if (p === null || c === null || b === null || soc === null) continue;
    okSlots++;
    producedKwh += (p * 0.25) / 1000;
    consumedKwh += (c * 0.25) / 1000;
    if (b > 0) chargedKwh += (b * 0.25) / 1000;
    else dischargedKwh += (-b * 0.25) / 1000;
    const g = c + b - p;
    if (g > 0) importKwh += (g * 0.25) / 1000;
    else exportKwh += (-g * 0.25) / 1000;
    socMin = socMin === null ? soc : Math.min(socMin, soc);
    socMax = socMax === null ? soc : Math.max(socMax, soc);
  }

  const coverage = elapsedSlots > 0 ? okSlots / elapsedSlots : 0;
  const selfSufficiencyPct =
    incomplete || consumedKwh === 0
      ? null
      : Math.round(((consumedKwh - importKwh) / consumedKwh) * 100);
  const selfConsumptionPct =
    incomplete || producedKwh === 0
      ? null
      : Math.round(((producedKwh - exportKwh) / producedKwh) * 100);

  return {
    producedKwh: round1(producedKwh),
    consumedKwh: round1(consumedKwh),
    chargedKwh: round1(chargedKwh),
    dischargedKwh: round1(dischargedKwh),
    selfSufficiencyPct,
    selfConsumptionPct,
    socMin,
    socMax,
    incomplete,
    coverage,
    elapsedSlots,
  };
}

export function dayVerdict(measures: Measure[], dayKey: string, pilotMode: PilotMode): Verdict {
  const summary = dailySummary(measures, dayKey);

  if (summary.elapsedSlots === 0 || summary.coverage < MIN_COVERAGE_FOR_VERDICT) {
    return {
      kind: 'insuffisant',
      title: 'Données insuffisantes pour ce jour',
      detail: 'Trop de données manquantes pour juger cette journée.',
    };
  }

  const slots = daySlots(measures, dayKey);
  let surplusKwh = 0;
  let solarChargedKwh = 0;
  for (const s of slots) {
    if (s.state !== 'ok') continue;
    const { productionW: p, consumptionW: c, batteryW: b } = s;
    if (p === null || c === null || b === null) continue;
    const surplus = Math.max(0, p - c);
    surplusKwh += (surplus * 0.25) / 1000;
    solarChargedKwh += (Math.min(Math.max(0, b), surplus) * 0.25) / 1000;
  }

  const socMax = summary.socMax ?? 0;
  if (
    surplusKwh >= ANOMALY_SURPLUS_KWH &&
    solarChargedKwh < ANOMALY_SOLAR_CHARGE_KWH &&
    socMax < ANOMALY_SOC_MAX_PCT
  ) {
    return {
      kind: 'anormal',
      title: 'La batterie ne se charge plus alors que les panneaux produisent',
      detail: '',
    };
  }

  let detail: string;
  if (surplusKwh < ANOMALY_SURPLUS_KWH) {
    detail = 'Peu de soleil : pas de surplus à stocker.';
  } else if (pilotMode === 'heures_creuses') {
    detail = 'Chargée la nuit en heures creuses, puis avec le surplus.';
  } else {
    detail = 'Chargée en journée avec le surplus, déchargée le soir.';
  }

  return { kind: 'normal', title: 'La batterie a travaillé normalement', detail };
}

export function detectAnomalyStart(
  measures: Measure[],
  untilDayKey: string,
  pilotMode: PilotMode,
): string | null {
  if (dayVerdict(measures, untilDayKey, pilotMode).kind !== 'anormal') return null;

  let earliest = untilDayKey;
  let cursor = untilDayKey;
  for (;;) {
    const prevDay = addDays(cursor, -1);
    if (!measures.some((m) => localDayKey(m.at) === prevDay)) break;
    const verdict = dayVerdict(measures, prevDay, pilotMode);
    if (verdict.kind === 'anormal') {
      earliest = prevDay;
      cursor = prevDay;
    } else if (verdict.kind === 'insuffisant') {
      cursor = prevDay;
    } else {
      break;
    }
  }
  return earliest;
}

export function dayStrip(
  measures: Measure[],
  lastDayKey: string,
  pilotMode: PilotMode,
  days = 8,
): StripDay[] {
  const result: StripDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayKey = addDays(lastDayKey, -i);
    const summary = dailySummary(measures, dayKey);
    const verdict = dayVerdict(measures, dayKey, pilotMode);
    const dow = formatDayShort(dayKey).split(' ')[0] ?? '';
    const dayNum = Number(dayKey.split('-')[2] ?? '0');
    result.push({
      dayKey,
      chargedKwh: summary.chargedKwh,
      dischargedKwh: summary.dischargedKwh,
      abnormal: verdict.kind === 'anormal',
      hasGap: summary.incomplete,
      dow,
      dayNum,
    });
  }
  return result;
}
