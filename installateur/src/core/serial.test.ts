import { describe, expect, it } from 'vitest';

import { batteryLabel, parseSerial } from './serial';

describe('parseSerial', () => {
  it('rejects an empty string', () => {
    expect(parseSerial('')).toEqual({ ok: false });
  });

  it('rejects an incomplete serial', () => {
    expect(parseSerial('RV-')).toEqual({ ok: false });
  });

  it('rejects a serial with a malformed second group', () => {
    expect(parseSerial('RV-1234-56789')).toEqual({ ok: false });
  });

  it('accepts a serial with surrounding whitespace', () => {
    expect(parseSerial(' RV-1234-5678 ')).toEqual({ ok: true, serial: 'RV-1234-5678' });
  });

  it('accepts a lowercase serial and uppercases it', () => {
    expect(parseSerial('rv-1234-5678')).toEqual({ ok: true, serial: 'RV-1234-5678' });
  });
});

describe('batteryLabel', () => {
  it('is deterministic for the same serial', () => {
    expect(batteryLabel('RV-1234-5678')).toBe(batteryLabel('RV-1234-5678'));
  });

  it('is one of the three known labels', () => {
    expect([
      'Revolty 5 kWh · 2 modules',
      'Revolty 10 kWh · 4 modules',
      'Revolty 15 kWh · 6 modules',
    ]).toContain(batteryLabel('RV-1234-5678'));
  });
});
