import { theme } from 'antd';
import type { ThemeConfig } from 'antd';
import { Density, FontFamily, FontScale, ThemePalette } from '@finni/shared';
import { finniFontFamily, finniFontSize, finniRadius, finniSeeds } from '@/theme/finniTokens';

export interface FinniThemeInput {
  readonly palette: ThemePalette;
  readonly density: Density;
  readonly fontScale: FontScale;
  readonly fontFamily: FontFamily;
}

// Maps the active preferences to an antd ThemeConfig. Compact composes compactAlgorithm over
// defaultAlgorithm (§4); the primary button carries dark ink, not white, per D22.
export const buildFinniTheme = (input: FinniThemeInput): ThemeConfig => {
  const seed = finniSeeds[input.palette];
  const algorithm =
    input.density === Density.Compact
      ? [theme.defaultAlgorithm, theme.compactAlgorithm]
      : [theme.defaultAlgorithm];

  return {
    algorithm,
    token: {
      colorPrimary: seed.colorPrimary,
      colorInfo: seed.colorInfo,
      colorSuccess: seed.colorSuccess,
      colorWarning: seed.colorWarning,
      colorError: seed.colorError,
      colorSuccessBg: seed.colorSuccessBg,
      colorSuccessBorder: seed.colorSuccessBorder,
      colorTextBase: seed.colorTextBase,
      colorBgLayout: seed.colorBgLayout,
      colorBgContainer: seed.colorBgContainer,
      colorBgElevated: seed.colorBgElevated,
      colorBorder: seed.colorBorder,
      borderRadius: finniRadius.md,
      fontFamily: finniFontFamily[input.fontFamily],
      fontSize: finniFontSize[input.fontScale],
      wireframe: false,
    },
    components: {
      Button: { primaryColor: seed.colorPrimaryInk, primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none' },
      Card: { borderRadiusLG: finniRadius.lg },
      Tag: { borderRadiusSM: finniRadius.sm },
      Drawer: { borderRadiusLG: finniRadius.lg },
    },
  };
};
