import { FontFamily, FontScale, PatientStatus, ThemePalette } from '@finni/shared';

// D42: single sanctioned home for raw token values. antd's ThemeConfig seed needs real hex
// (its ramp algorithm can't derive from a var()) and real numbers, so the token source is
// the one place C6's "reference a token" can't apply — it IS the token. Lint-exempt, like D36.

// Brand anchors (D21): Finni's real brand variables, adapted for management-app density.
const finniOrange = '#ed762f';
// Dark ink on the orange button (D22): white-on-orange is 2.90 (fails AA); ink is 4.96 (passes).
const finniOrangeInk = '#3d2410';
const finniSlate = '#34415b';

export interface FinniSeed {
  readonly colorPrimary: string;
  readonly colorPrimaryInk: string;
  readonly colorTextBase: string;
  readonly colorBgLayout: string;
  readonly colorBgContainer: string;
  readonly colorBgElevated: string;
  readonly colorBorder: string;
  readonly colorInfo: string;
  readonly colorSuccess: string;
  readonly colorWarning: string;
  readonly colorError: string;
  // antd's generator yields a greyed tint-1 for green seeds in this theme, so the success
  // alert/tag background is set explicitly; info/warning/error derive cleanly on their own.
  readonly colorSuccessBg: string;
  readonly colorSuccessBorder: string;
}

// Two palettes (D23): default (warm cream surface) and eye-strain (dimmer, lower-glare surface
// for the long hours providers work). Both keep Finni's signature orange. The semantic colors
// (info/success/warning/error) seed antd's alerts/buttons — kept distinct from the status-tag
// colors below, whose darker AA-on-tint values would muddy antd's derived alert backgrounds.
export const finniSeeds: Record<ThemePalette, FinniSeed> = {
  [ThemePalette.Default]: {
    colorPrimary: finniOrange,
    colorPrimaryInk: finniOrangeInk,
    colorTextBase: finniSlate,
    colorBgLayout: '#fbf7f0',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBorder: '#e7ddcf',
    colorInfo: '#1f6fc4',
    colorSuccess: '#2f9e5b',
    colorWarning: '#e0a106',
    colorError: '#cc3552',
    colorSuccessBg: '#e9f7ef',
    colorSuccessBorder: '#b7e3c8',
  },
  [ThemePalette.EyeStrain]: {
    colorPrimary: finniOrange,
    colorPrimaryInk: finniOrangeInk,
    colorTextBase: '#3b4456',
    colorBgLayout: '#f4ece0',
    colorBgContainer: '#faf6ef',
    colorBgElevated: '#fbf8f2',
    colorBorder: '#ddd0bd',
    colorInfo: '#3a6ea5',
    colorSuccess: '#4f9069',
    colorWarning: '#c2902f',
    colorError: '#b3475e',
    colorSuccessBg: '#e7f1ea',
    colorSuccessBorder: '#bcd9c6',
  },
};

export interface StatusColorSet {
  readonly fg: string;
  readonly bg: string;
}

// Six status colors as an intentional lifecycle progression (D23). Every fg/bg pair is verified
// ≥4.5:1 (WCAG AA) by a11y/statusColorContrast.test.ts — never eyeballed.
export const finniStatusColors: Record<ThemePalette, Record<PatientStatus, StatusColorSet>> = {
  [ThemePalette.Default]: {
    [PatientStatus.Inquiry]: { fg: '#1f6fc4', bg: '#eaf2fb' },
    [PatientStatus.Waitlisted]: { fg: '#845c00', bg: '#f9f1de' },
    [PatientStatus.Onboarding]: { fg: '#0f766e', bg: '#e3f4f1' },
    [PatientStatus.Active]: { fg: '#1f7a3d', bg: '#e6f4ea' },
    [PatientStatus.Paused]: { fg: '#575793', bg: '#eeeef7' },
    [PatientStatus.Churned]: { fg: '#b23149', bg: '#fbe9ec' },
  },
  [ThemePalette.EyeStrain]: {
    [PatientStatus.Inquiry]: { fg: '#3a6ea5', bg: '#e8eef5' },
    [PatientStatus.Waitlisted]: { fg: '#7a5912', bg: '#f1ead9' },
    [PatientStatus.Onboarding]: { fg: '#2c6f69', bg: '#e2efed' },
    [PatientStatus.Active]: { fg: '#3a6f4c', bg: '#e6efe8' },
    [PatientStatus.Paused]: { fg: '#5f5f86', bg: '#ececf3' },
    [PatientStatus.Churned]: { fg: '#9d4452', bg: '#f6e7ea' },
  },
};

// Deterministic avatar fallback backgrounds (D26): a fixed warm-leaning ring; a name/id hash
// picks one. White silhouette overlays these, so they stay mid-tone for visibility.
export const finniAvatarColors: readonly string[] = [
  '#c2613a',
  '#3f7d6e',
  '#4a6aa5',
  '#8a5fa3',
  '#a6713f',
  '#5f7a3a',
  '#9c5560',
  '#3d7088',
];
export const finniAvatarSilhouette = '#fbf7f0';

// Warm rounded feel (D24): larger radii than antd defaults; skeuomorphic shadows retired.
export const finniRadius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;
export const finniSpacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

// Base font size per FontScale preference; antd derives its size ramp from this.
export const finniFontSize: Record<FontScale, number> = {
  [FontScale.Small]: 13,
  [FontScale.Medium]: 14,
  [FontScale.Large]: 16,
};

// Font-family stacks per FontFamily preference. OpenDyslexic ships as a later asset drop (like
// the logo); the stack falls back to Comic Sans MS, which the British Dyslexia Association lists
// as dyslexia-friendly, then to the sans stack.
const sansStack =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const finniFontFamily: Record<FontFamily, string> = {
  [FontFamily.Sans]: sansStack,
  [FontFamily.Serif]: "'Georgia', 'Iowan Old Style', 'Times New Roman', serif",
  [FontFamily.Dyslexic]: `'OpenDyslexic', 'Comic Sans MS', ${sansStack}`,
};
