import { describe, expect, it } from 'vitest';
import { DateTimeUtil } from '@/datetime/DateTimeUtil';

describe('DateTimeUtil.calculateAge', () => {
  it('returns the age on the exact birthday', () => {
    expect(DateTimeUtil.calculateAge('2000-06-15', '2024-06-15')).toBe(24);
  });

  it('does not count the birthday until it arrives', () => {
    expect(DateTimeUtil.calculateAge('2000-06-15', '2024-06-14')).toBe(23);
  });

  it('counts the year once the birthday has passed', () => {
    expect(DateTimeUtil.calculateAge('2000-06-15', '2024-06-16')).toBe(24);
  });

  it('ages a leap-day birthday on Feb 28 in a non-leap year (dayjs clamps +1yr to Feb 28)', () => {
    expect(DateTimeUtil.calculateAge('2000-02-29', '2001-02-27')).toBe(0);
    expect(DateTimeUtil.calculateAge('2000-02-29', '2001-02-28')).toBe(1);
  });

  it('handles a leap-day birthday on a leap year', () => {
    expect(DateTimeUtil.calculateAge('2000-02-29', '2004-02-29')).toBe(4);
  });

  it('returns 0 for an infant born this year', () => {
    expect(DateTimeUtil.calculateAge('2024-01-01', '2024-06-01')).toBe(0);
  });
});

describe('DateTimeUtil.formatDob', () => {
  it('formats with no zone shift using the default format', () => {
    expect(DateTimeUtil.formatDob('2000-01-01')).toBe('Jan 1, 2000');
  });

  it('honors a custom format', () => {
    expect(DateTimeUtil.formatDob('2000-12-31', 'YYYY/MM/DD')).toBe('2000/12/31');
  });
});

describe('DateTimeUtil.isValidDate', () => {
  it('accepts a real calendar date', () => {
    expect(DateTimeUtil.isValidDate('2000-01-01')).toBe(true);
  });

  it('accepts Feb 29 on a leap year', () => {
    expect(DateTimeUtil.isValidDate('2000-02-29')).toBe(true);
  });

  it('rejects Feb 29 on a non-leap year', () => {
    expect(DateTimeUtil.isValidDate('2001-02-29')).toBe(false);
  });

  it('rejects an impossible month or day', () => {
    expect(DateTimeUtil.isValidDate('2000-13-01')).toBe(false);
    expect(DateTimeUtil.isValidDate('2000-02-30')).toBe(false);
  });
});

describe('DateTimeUtil.isFuture', () => {
  it('is true for a date after the reference day', () => {
    expect(DateTimeUtil.isFuture('2025-01-01', '2024-01-01')).toBe(true);
  });

  it('is false for the reference day itself and earlier', () => {
    expect(DateTimeUtil.isFuture('2024-01-01', '2024-01-01')).toBe(false);
    expect(DateTimeUtil.isFuture('2023-01-01', '2024-01-01')).toBe(false);
  });
});

describe('DateTimeUtil.toUserZone', () => {
  it('converts a UTC timestamp to a zone in standard time', () => {
    expect(DateTimeUtil.toUserZone('2024-01-01T00:00:00Z', 'America/New_York', 'YYYY-MM-DD HH:mm')).toBe(
      '2023-12-31 19:00',
    );
  });

  it('converts a UTC timestamp to a zone in daylight time', () => {
    expect(DateTimeUtil.toUserZone('2024-07-01T00:00:00Z', 'America/New_York', 'YYYY-MM-DD HH:mm')).toBe(
      '2024-06-30 20:00',
    );
  });

  it('is identity-formatting for UTC', () => {
    expect(DateTimeUtil.toUserZone('2024-01-01T12:00:00Z', 'UTC', 'YYYY-MM-DD HH:mm')).toBe('2024-01-01 12:00');
  });
});

describe('DateTimeUtil.resolveTimezone', () => {
  it('returns the preferred zone when set', () => {
    expect(DateTimeUtil.resolveTimezone('America/Chicago')).toBe('America/Chicago');
  });

  it('falls back to a non-empty runtime zone when absent', () => {
    expect(DateTimeUtil.resolveTimezone(null).length).toBeGreaterThan(0);
    expect(typeof DateTimeUtil.resolveTimezone()).toBe('string');
  });
});

describe('DateTimeUtil.nowUtc', () => {
  it('returns an ISO-8601 UTC string', () => {
    expect(DateTimeUtil.nowUtc()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/);
  });
});

describe('DateTimeUtil.subtractDaysUtc', () => {
  it('subtracts whole days and stays in UTC', () => {
    expect(DateTimeUtil.subtractDaysUtc('2024-01-31T00:00:00Z', 30)).toBe('2024-01-01T00:00:00.000Z');
  });
});
