import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { App } from 'antd';
import { ThemeProvider } from 'antd-style';
import { usePreferencesStore } from '@/state/usePreferencesStore';
import { buildFinniTheme } from '@/theme/finniTheme';
import { buildFinniCssVariables } from '@/theme/cssVariables';
import { finniFontFamily, finniFontSize, finniSeeds } from '@/theme/finniTokens';

interface FinniThemeProviderProps {
  children: ReactNode;
}

// Single wiring point: store prefs → antd ThemeConfig (antd-style ThemeProvider) + :root CSS
// vars + document base styles. antd App supplies message/notification context for primitives.
export function FinniThemeProvider({ children }: FinniThemeProviderProps): JSX.Element {
  const themePalette = usePreferencesStore((state) => state.themePalette);
  const density = usePreferencesStore((state) => state.density);
  const fontScale = usePreferencesStore((state) => state.fontScale);
  const fontFamily = usePreferencesStore((state) => state.fontFamily);

  const themeConfig = useMemo(
    () => buildFinniTheme({ palette: themePalette, density, fontScale, fontFamily }),
    [themePalette, density, fontScale, fontFamily],
  );

  useEffect(() => {
    const root = document.documentElement;
    const variables = buildFinniCssVariables(themePalette);
    for (const [name, value] of Object.entries(variables)) {
      root.style.setProperty(name, value);
    }
    root.style.setProperty('--finni-font-family', finniFontFamily[fontFamily]);
    root.style.setProperty('--finni-font-size', `${finniFontSize[fontScale]}px`);

    const seed = finniSeeds[themePalette];
    document.body.style.margin = '0';
    document.body.style.background = seed.colorBgLayout;
    document.body.style.color = seed.colorTextBase;
    document.body.style.fontFamily = finniFontFamily[fontFamily];
    document.body.style.fontSize = `${finniFontSize[fontScale]}px`;
  }, [themePalette, fontFamily, fontScale]);

  return (
    <ThemeProvider theme={themeConfig}>
      <App>{children}</App>
    </ThemeProvider>
  );
}
