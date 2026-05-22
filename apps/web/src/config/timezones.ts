// Curated US + Canada IANA zones for the settings picker, replacing runtime enumeration of every
// world zone. Labels carry a city + offset name so providers recognize them without IANA literacy.
// The 'auto' sentinel clears the override back to DateTimeUtil.resolveTimezone (browser-detected).
export const TIMEZONE_AUTO = 'auto';

export interface TimezoneOption {
  value: string;
  label: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: TIMEZONE_AUTO, label: 'Auto-detect' },
  { value: 'America/New_York', label: 'Eastern — New York' },
  { value: 'America/Chicago', label: 'Central — Chicago' },
  { value: 'America/Denver', label: 'Mountain — Denver' },
  { value: 'America/Phoenix', label: 'Mountain (no DST) — Phoenix' },
  { value: 'America/Los_Angeles', label: 'Pacific — Los Angeles' },
  { value: 'America/Anchorage', label: 'Alaska — Anchorage' },
  { value: 'America/Adak', label: 'Hawaii–Aleutian — Adak' },
  { value: 'Pacific/Honolulu', label: 'Hawaii — Honolulu' },
  { value: 'America/Toronto', label: 'Eastern — Toronto' },
  { value: 'America/Winnipeg', label: 'Central — Winnipeg' },
  { value: 'America/Regina', label: 'Central (no DST) — Regina' },
  { value: 'America/Edmonton', label: 'Mountain — Edmonton' },
  { value: 'America/Vancouver', label: 'Pacific — Vancouver' },
  { value: 'America/Halifax', label: 'Atlantic — Halifax' },
  { value: 'America/St_Johns', label: 'Newfoundland — St. John’s' },
  { value: 'America/Whitehorse', label: 'Yukon — Whitehorse' },
];
