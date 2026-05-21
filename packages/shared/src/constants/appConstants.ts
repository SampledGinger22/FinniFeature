import type { UserPreferences } from '@/types/entities';
import { Density, FontFamily, FontScale, ThemePalette } from '@/enums/preferenceEnums';

// App-wide constants (spec §6.4). Single source so behavior can't drift across layers.

// Soft-deleted records are recoverable for this many days, then purged (spec §12).
export const SOFT_DELETE_PURGE_DAYS = 30;

// Pagination defaults for list queries.
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

// In-memory LRU cache defaults (spec §2); swappable for Redis behind the cache interface.
export const DEFAULT_CACHE_TTL_MS = 60_000;
export const DEFAULT_CACHE_MAX_ENTRIES = 500;

// Default country for addresses when unspecified (§6.1).
export const DEFAULT_COUNTRY = 'US';

// Initial preferences before the user changes anything; compact density on by default (§4).
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  fontFamily: FontFamily.Sans,
  fontScale: FontScale.Medium,
  themePalette: ThemePalette.Default,
  density: Density.Compact,
  timezone: null,
};
