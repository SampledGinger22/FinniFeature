import { Button, Card, Select, Segmented } from 'antd';
import { useNavigate } from 'react-router-dom';
import { DateTimeUtil, Density, FontFamily, FontScale, ThemePalette } from '@finni/shared';
import { PageHeader } from '@/components/molecules/PageHeader';
import { DemoControls } from '@/components/organisms/DemoControls';
import { usePreferencesStore } from '@/state/usePreferencesStore';
import { useSettingsPageStyles } from '@/pages/SettingsPage.styles';
import { TIMEZONE_AUTO, TIMEZONE_OPTIONS } from '@/config/timezones';

// Human-readable labels for each ThemePalette value — displayed in the Select control.
const themePaletteLabels: Record<ThemePalette, string> = {
  [ThemePalette.Default]: 'Default (warm cream)',
  [ThemePalette.EyeStrain]: 'Low glare (eye strain)',
};

// Human-readable labels for each FontFamily value — displayed in the Select control.
const fontFamilyLabels: Record<FontFamily, string> = {
  [FontFamily.Sans]: 'Sans-serif (Inter)',
  [FontFamily.Serif]: 'Serif (Georgia)',
  [FontFamily.Dyslexic]: 'Dyslexia-friendly (OpenDyslexic)',
};

// Human-readable labels for each FontScale value — displayed in the Segmented control.
const fontScaleLabels: Record<FontScale, string> = {
  [FontScale.Small]: 'Small',
  [FontScale.Medium]: 'Medium',
  [FontScale.Large]: 'Large',
};

// Human-readable labels for each Density value — displayed in the Segmented control.
const densityLabels: Record<Density, string> = {
  [Density.Compact]: 'Compact',
  [Density.Comfortable]: 'Comfortable',
};

// Option lists derive only from static enum values, so they are built once at module scope.
const themePaletteOptions = Object.values(ThemePalette).map((value) => ({ label: themePaletteLabels[value], value }));
const fontFamilyOptions = Object.values(FontFamily).map((value) => ({ label: fontFamilyLabels[value], value }));
const fontScaleSegmentOptions = Object.values(FontScale).map((value) => ({ label: fontScaleLabels[value], value }));
const densitySegmentOptions = Object.values(Density).map((value) => ({ label: densityLabels[value], value }));

// Settings page: wires usePreferencesStore to controls so every change propagates live through
// FinniThemeProvider without a page reload. DemoControls is kept in a clearly-separated card.
export function SettingsPage(): JSX.Element {
  const { styles } = useSettingsPageStyles();

  const themePalette = usePreferencesStore((state) => state.themePalette);
  const fontFamily = usePreferencesStore((state) => state.fontFamily);
  const fontScale = usePreferencesStore((state) => state.fontScale);
  const density = usePreferencesStore((state) => state.density);
  const timezone = usePreferencesStore((state) => state.timezone);
  const setThemePalette = usePreferencesStore((state) => state.setThemePalette);
  const setFontFamily = usePreferencesStore((state) => state.setFontFamily);
  const setFontScale = usePreferencesStore((state) => state.setFontScale);
  const setDensity = usePreferencesStore((state) => state.setDensity);
  const setTimezone = usePreferencesStore((state) => state.setTimezone);
  const reset = usePreferencesStore((state) => state.reset);

  const navigate = useNavigate();
  const effectiveTimezone = DateTimeUtil.resolveTimezone(timezone);

  const handleTimezoneChange = (value: string): void => {
    setTimezone(value === TIMEZONE_AUTO ? null : value);
  };

  return (
    <>
      <PageHeader title="Settings" />

      <div className={styles.body}>
        <Card title="Appearance">
          <div className={styles.formRow}>
            <span className={styles.labelCol}>Theme palette</span>
            <div className={styles.controlCol}>
              <Select<ThemePalette>
                value={themePalette}
                options={themePaletteOptions}
                onChange={setThemePalette}
                aria-label="Theme palette"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <span className={styles.labelCol}>Font family</span>
            <div className={styles.controlCol}>
              <Select<FontFamily>
                value={fontFamily}
                options={fontFamilyOptions}
                onChange={setFontFamily}
                aria-label="Font family"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <span className={styles.labelCol}>Text size</span>
            <div className={styles.controlCol}>
              <Segmented<FontScale>
                value={fontScale}
                options={fontScaleSegmentOptions}
                onChange={setFontScale}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <span className={styles.labelCol}>Density</span>
            <div className={styles.controlCol}>
              <Segmented<Density>
                value={density}
                options={densitySegmentOptions}
                onChange={setDensity}
              />
            </div>
          </div>
        </Card>

        <Card title="Date & time">
          <div className={styles.formRow}>
            <span className={styles.labelCol}>Timezone</span>
            <div className={styles.controlCol}>
              <Select
                showSearch
                optionFilterProp="label"
                value={timezone ?? TIMEZONE_AUTO}
                options={TIMEZONE_OPTIONS}
                onChange={handleTimezoneChange}
                aria-label="Timezone"
              />
              <span className={styles.helperText}>
                Effective timezone: {effectiveTimezone}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Trash">
          <div className={styles.formRow}>
            <span className={styles.labelCol}>Deleted patients</span>
            <div className={styles.controlCol}>
              <Button onClick={() => navigate('/trash')}>Open Trash</Button>
              <span className={styles.helperText}>Restore or permanently delete soft-deleted patients.</span>
            </div>
          </div>
        </Card>

        <DemoControls />

        <Button onClick={reset}>Reset to defaults</Button>
      </div>
    </>
  );
}
