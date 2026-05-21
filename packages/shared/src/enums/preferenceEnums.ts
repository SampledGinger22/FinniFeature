// Preference enums — const-object union pattern (spec §6.4). Drive the settings page and
// the theme system; persisted to localStorage (prefs only, never PHI — spec §10).

export const FontFamily = {
  Sans: 'sans',
  Serif: 'serif',
  Dyslexic: 'dyslexic',
} as const;
export type FontFamily = (typeof FontFamily)[keyof typeof FontFamily];

export const FontScale = {
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
} as const;
export type FontScale = (typeof FontScale)[keyof typeof FontScale];

export const ThemePalette = {
  Default: 'default',
  EyeStrain: 'eye-strain',
} as const;
export type ThemePalette = (typeof ThemePalette)[keyof typeof ThemePalette];

// Compact is the default (spec §4); composes antd compactAlgorithm + defaultAlgorithm.
export const Density = {
  Compact: 'compact',
  Comfortable: 'comfortable',
} as const;
export type Density = (typeof Density)[keyof typeof Density];
