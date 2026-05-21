import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_USER_PREFERENCES } from '@finni/shared';
import type { Density, FontFamily, FontScale, ThemePalette, UserPreferences } from '@finni/shared';

// Zustand owns global UI state (§9); these prefs persist to localStorage (§10) — prefs only,
// never PHI. TanStack Query, not this store, will own server data when features land.
interface PreferencesState extends UserPreferences {
  setFontFamily: (value: FontFamily) => void;
  setFontScale: (value: FontScale) => void;
  setThemePalette: (value: ThemePalette) => void;
  setDensity: (value: Density) => void;
  setTimezone: (value: string | null) => void;
  reset: () => void;
}

const PREFERENCES_STORAGE_KEY = 'finni.preferences';

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_USER_PREFERENCES,
      setFontFamily: (value) => set({ fontFamily: value }),
      setFontScale: (value) => set({ fontScale: value }),
      setThemePalette: (value) => set({ themePalette: value }),
      setDensity: (value) => set({ density: value }),
      setTimezone: (value) => set({ timezone: value }),
      reset: () => set({ ...DEFAULT_USER_PREFERENCES }),
    }),
    { name: PREFERENCES_STORAGE_KEY },
  ),
);
