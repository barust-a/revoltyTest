import { hash32 } from './hash';
import { SERIAL_PATTERN } from './types';

const BATTERY_LABELS = [
  'Revolty 5 kWh · 2 modules',
  'Revolty 10 kWh · 4 modules',
  'Revolty 15 kWh · 6 modules',
] as const;

export function parseSerial(input: string): { ok: true; serial: string } | { ok: false } {
  const serial = input.trim().toUpperCase();
  if (!SERIAL_PATTERN.test(serial)) return { ok: false };
  return { ok: true, serial };
}

export function batteryLabel(serial: string): string {
  const label = BATTERY_LABELS[hash32(serial) % 3];
  if (label === undefined) throw new Error('unreachable');
  return label;
}
