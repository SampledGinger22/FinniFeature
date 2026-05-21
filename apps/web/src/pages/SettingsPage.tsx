import { Typography } from 'antd';
import { Link } from 'react-router-dom';
import { BrandLogo } from '@/components/atoms/BrandLogo';
import { DemoControls } from '@/components/organisms/DemoControls';
import { useSettingsPageStyles } from '@/pages/SettingsPage.styles';

// Placeholder settings page — replaced by the settings stream in Step 5. Will wire the
// preferences store (font, scale, palette, density, timezone) to controls.
export function SettingsPage(): JSX.Element {
  const { styles } = useSettingsPageStyles();
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <BrandLogo />
        <Typography.Title level={3} className={styles.title}>
          Settings
        </Typography.Title>
        <Link to="/">Back to caseload</Link>
      </header>
      <Typography.Paragraph>Preference controls coming in Step 5.</Typography.Paragraph>
      <DemoControls />
    </div>
  );
}
