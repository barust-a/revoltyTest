import { describe, expect, it } from 'vitest';

import {
  addDays,
  dayStartIso,
  formatAgo,
  formatClock,
  formatDayShort,
  formatDue,
  formatDuration,
  formatSinceDetailed,
  localDayKey,
  localHour,
} from './time';

const NOW = new Date('2026-09-24T13:00:00Z'); // jeu. 24 sept., 15:00 à Lyon

describe('local day handling (Lyon, UTC+2 in September)', () => {
  it('puts 22:30 UTC on the next local day', () => {
    expect(localDayKey('2026-09-20T22:30:00Z')).toBe('2026-09-21');
  });

  it('keeps 21:59 UTC on the same local day', () => {
    expect(localDayKey('2026-09-20T21:59:00Z')).toBe('2026-09-20');
  });

  it('starts a local day at 22:00 UTC the day before', () => {
    expect(dayStartIso('2026-09-21')).toBe('2026-09-20T22:00:00.000Z');
  });

  it('adds days across a month boundary', () => {
    expect(addDays('2026-09-30', 2)).toBe('2026-10-02');
    expect(addDays('2026-09-01', -1)).toBe('2026-08-31');
  });

  it('gives the local hour', () => {
    expect(localHour('2026-09-24T13:30:00Z')).toBe(15.5);
  });
});

describe('French formatting without locale APIs', () => {
  it('formats short days', () => {
    expect(formatDayShort('2026-09-21')).toBe('lun. 21 sept.');
    expect(formatDayShort('2026-10-01')).toBe('jeu. 1er oct.');
  });

  it('formats a clock time in local time', () => {
    expect(formatClock('2026-09-24T12:05:00Z')).toBe('14:05');
    expect(formatClock('2026-09-23T23:00:00Z')).toBe('01:00');
  });

  it('formats elapsed time', () => {
    expect(formatAgo('2026-09-24T12:48:00Z', NOW)).toBe('il y a 12 min');
    expect(formatAgo('2026-09-23T23:00:00Z', NOW)).toBe('il y a 14 h');
    expect(formatAgo('2026-09-21T12:00:00Z', NOW)).toBe('il y a 3 j');
    expect(formatAgo('2026-09-24T12:59:40Z', NOW)).toBe("à l'instant");
  });

  it('formats durations', () => {
    expect(formatDuration('2026-09-24T12:20:00Z', NOW)).toBe('40 min');
    expect(formatDuration('2026-09-23T23:00:00Z', NOW)).toBe('14 h');
    expect(formatDuration('2026-09-21T12:00:00Z', NOW)).toBe('3 jours');
    expect(formatDuration('2026-09-23T12:00:00Z', NOW)).toBe('1 jour');
  });

  it('formats due dates relative to today', () => {
    expect(formatDue('2026-09-24T16:00:00Z', NOW)).toBe("Aujourd'hui");
    expect(formatDue('2026-09-25T16:00:00Z', NOW)).toBe('Demain');
    expect(formatDue('2026-09-23T16:00:00Z', NOW)).toBe('Hier');
    expect(formatDue('2026-10-01T16:00:00Z', NOW)).toBe('jeu. 1er oct.');
  });

  it('formats a detailed "since" line', () => {
    expect(formatSinceDetailed('2026-09-21T12:00:00Z', NOW)).toBe(
      'Depuis lun. 21 sept., 14 h (3 jours)',
    );
  });
});
