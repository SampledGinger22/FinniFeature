import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// The one place dayjs is configured and dates are constructed (rule C8). Everything else
// routes through DateTimeUtil so display and filter logic can never disagree.
dayjs.extend(utc);
dayjs.extend(timezone);

const DATE_ONLY_FORMAT = 'YYYY-MM-DD';
const DEFAULT_DOB_DISPLAY_FORMAT = 'MMM D, YYYY';
const DEFAULT_DATETIME_DISPLAY_FORMAT = 'MMM D, YYYY h:mm A';

export const DateTimeUtil = {
  // Age in whole years from a zoneless DOB. referenceDate (YYYY-MM-DD) makes it testable;
  // diff('year') truncates and respects the month/day so birthdays land correctly.
  calculateAge(dateOfBirth: string, referenceDate?: string): number {
    const reference = referenceDate ? dayjs(referenceDate) : dayjs();
    return reference.diff(dayjs(dateOfBirth), 'year');
  },

  // Format a DOB with no zone conversion — a birthday must not shift across midnight (§7).
  formatDob(dateOfBirth: string, format: string = DEFAULT_DOB_DISPLAY_FORMAT): string {
    return dayjs(dateOfBirth).format(format);
  },

  // Render a stored UTC timestamp in the user's zone (§7).
  toUserZone(utcTimestamp: string, zone: string, format: string = DEFAULT_DATETIME_DISPLAY_FORMAT): string {
    return dayjs.utc(utcTimestamp).tz(zone).format(format);
  },

  // Settings override wins; otherwise the browser/runtime default (§7).
  resolveTimezone(preferred?: string | null): string {
    if (preferred) return preferred;
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  // Current instant as an ISO-8601 UTC string — for created_at/updated_at/deleted_at.
  nowUtc(): string {
    return dayjs.utc().toISOString();
  },

  // True only for a real calendar date in YYYY-MM-DD (round-trip rejects e.g. 2000-02-30).
  isValidDate(dateOnly: string): boolean {
    const parsed = dayjs(dateOnly);
    return parsed.isValid() && parsed.format(DATE_ONLY_FORMAT) === dateOnly;
  },

  // True if the date is after the reference day (used to reject future DOBs).
  isFuture(dateOnly: string, referenceDate?: string): boolean {
    const reference = referenceDate ? dayjs(referenceDate) : dayjs();
    return dayjs(dateOnly).isAfter(reference, 'day');
  },
} as const;
