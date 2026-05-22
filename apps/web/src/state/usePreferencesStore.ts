import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_USER_PREFERENCES } from '@finni/shared';
import type { Density, FontFamily, FontScale, ThemePalette, UserPreferences } from '@finni/shared';

// Zustand owns global UI state (§9); these prefs persist to localStorage (§10) — prefs only,
// never PHI. TanStack Query, not this store, will own server data when features land.
// sidebarCollapsed is layout state, not a domain preference, so it lives on the store but stays
// out of the shared UserPreferences contract. It persists (the user expects collapse to stick)
// and is intentionally untouched by reset(), which only restores themeable preferences.
interface PreferencesState extends UserPreferences {
  sidebarCollapsed: boolean;
  setFontFamily: (value: FontFamily) => void;
  setFontScale: (value: FontScale) => void;
  setThemePalette: (value: ThemePalette) => void;
  setDensity: (value: Density) => void;
  setTimezone: (value: string | null) => void;
  toggleSidebar: () => void;
  reset: () => void;
}

const PREFERENCES_STORAGE_KEY = 'finni.preferences';

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_USER_PREFERENCES,
      sidebarCollapsed: false,
      setFontFamily: (value) => set({ fontFamily: value }),
      setFontScale: (value) => set({ fontScale: value }),
      setThemePalette: (value) => set({ themePalette: value }),
      setDensity: (value) => set({ density: value }),
      setTimezone: (value) => set({ timezone: value }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      reset: () => set({ ...DEFAULT_USER_PREFERENCES }),
    }),
    { name: PREFERENCES_STORAGE_KEY },
  ),
);
