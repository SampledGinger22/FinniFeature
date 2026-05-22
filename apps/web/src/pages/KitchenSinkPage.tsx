import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Divider,
  Empty,
  Input,
  Radio,
  Result,
  Segmented,
  Select,
  Skeleton,
  Space,
  Spin,
  Switch,
  Typography,
} from 'antd';
import { Density, FontFamily, FontScale, PatientStatus, ThemePalette } from '@finni/shared';
import { usePreferencesStore } from '@/state/usePreferencesStore';
import { BrandLogo } from '@/components/atoms/BrandLogo';
import { StatusTag } from '@/components/atoms/StatusTag';
import { PatientAvatar } from '@/components/atoms/PatientAvatar';
import { ErrorBoundary } from '@/components/molecules/ErrorBoundary';
import { useKitchenSinkStyles } from '@/pages/KitchenSinkPage.styles';

const paletteOptions = [
  { label: 'Default', value: ThemePalette.Default },
  { label: 'Eye-strain', value: ThemePalette.EyeStrain },
];
const densityOptions = [
  { label: 'Compact', value: Density.Compact },
  { label: 'Comfortable', value: Density.Comfortable },
];
const fontFamilyOptions = [
  { label: 'Sans', value: FontFamily.Sans },
  { label: 'Serif', value: FontFamily.Serif },
  { label: 'Dyslexic', value: FontFamily.Dyslexic },
];
const fontScaleOptions = [
  { label: 'Small', value: FontScale.Small },
  { label: 'Medium', value: FontScale.Medium },
  { label: 'Large', value: FontScale.Large },
];

const sampleSeeds = ['Avery Johnson', 'Mateo Garcia', 'Priya Nair', 'Liam O’Connor', 'Zoe Williams'];
// Inline data-URI headshot so the photo path renders deterministically offline (no network).
const sampleHeadshot =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%233f7d6e'/><circle cx='32' cy='26' r='12' fill='%23fbf7f0'/><rect x='14' y='42' width='36' height='22' rx='11' fill='%23fbf7f0'/></svg>";

function ExplodingWidget({ shouldThrow }: { shouldThrow: boolean }): JSX.Element {
  if (shouldThrow) {
    throw new Error('Demo: widget render failure');
  }
  return <Alert type="success" message="Widget healthy" showIcon />;
}

// Renders every primitive in every state and wires the live theme controls — the surface a
// reviewer (and Playwright) inspects before any feature is built.
export function KitchenSinkPage(): JSX.Element {
  const { styles } = useKitchenSinkStyles();
  const themePalette = usePreferencesStore((state) => state.themePalette);
  const density = usePreferencesStore((state) => state.density);
  const fontFamily = usePreferencesStore((state) => state.fontFamily);
  const fontScale = usePreferencesStore((state) => state.fontScale);
  const setThemePalette = usePreferencesStore((state) => state.setThemePalette);
  const setDensity = usePreferencesStore((state) => state.setDensity);
  const setFontFamily = usePreferencesStore((state) => state.setFontFamily);
  const setFontScale = usePreferencesStore((state) => state.setFontScale);
  const [broken, setBroken] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <BrandLogo />
        <span className={styles.darkPanel}>
          <BrandLogo onDark />
        </span>
        <Button type="primary">Add patient</Button>
      </header>

      <Card title="Appearance" size="small">
        <div className={styles.controls}>
          <div className={styles.control}>
            <span className={styles.controlLabel}>Palette</span>
            <Segmented options={paletteOptions} value={themePalette} onChange={(value) => setThemePalette(value as ThemePalette)} />
          </div>
          <div className={styles.control}>
            <span className={styles.controlLabel}>Density</span>
            <Segmented options={densityOptions} value={density} onChange={(value) => setDensity(value as Density)} />
          </div>
          <div className={styles.control}>
            <span className={styles.controlLabel}>Font</span>
            <Segmented options={fontFamilyOptions} value={fontFamily} onChange={(value) => setFontFamily(value as FontFamily)} />
          </div>
          <div className={styles.control}>
            <span className={styles.controlLabel}>Text size</span>
            <Segmented options={fontScaleOptions} value={fontScale} onChange={(value) => setFontScale(value as FontScale)} />
          </div>
        </div>
      </Card>

      <Card title="Status lifecycle" size="small">
        <div className={styles.row}>
          {Object.values(PatientStatus).map((status) => (
            <StatusTag key={status} status={status} />
          ))}
        </div>
      </Card>

      <Card title="Patient avatars" size="small">
        <div className={styles.row}>
          {sampleSeeds.map((seed) => (
            <PatientAvatar key={seed} seed={seed} size="large" />
          ))}
          <Divider type="vertical" />
          <PatientAvatar seed="With headshot" src={sampleHeadshot} size="large" alt="Sample headshot" />
        </div>
      </Card>

      <Card title="Buttons" size="small">
        <div className={styles.row}>
          <Button type="primary">Primary</Button>
          <Button>Default</Button>
          <Button type="dashed">Dashed</Button>
          <Button type="text">Text</Button>
          <Button type="link">Link</Button>
          <Button danger>Danger</Button>
          <Button type="primary" loading>
            Loading
          </Button>
          <Button type="primary" disabled>
            Disabled
          </Button>
        </div>
      </Card>

      <Card title="Form controls" size="small">
        <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
          <div className={styles.row}>
            <Input placeholder="First name" />
            <Input.Password placeholder="Password" />
            <Select
              placeholder="Region"
              options={[
                { value: 'NY', label: 'New York' },
                { value: 'CA', label: 'California' },
                { value: 'TX', label: 'Texas' },
              ]}
            />
            <DatePicker placeholder="Date of birth" />
          </div>
          <div className={styles.row}>
            <Checkbox>Has insurance</Checkbox>
            <Radio.Group
              options={[
                { value: 'card', label: 'Card' },
                { value: 'table', label: 'Table' },
              ]}
              defaultValue="card"
              optionType="button"
            />
            <Switch defaultChecked />
            <Input placeholder="Disabled" disabled />
          </div>
        </Space>
      </Card>

      <Card title="Feedback" size="small">
        <Space direction="vertical" size="small" style={{ display: 'flex' }}>
          <Alert type="info" message="Informational message" showIcon />
          <Alert type="success" message="Saved successfully" showIcon />
          <Alert type="warning" message="Heads up — check this" showIcon />
          <Alert type="error" message="Something went wrong" showIcon />
          <Spin />
        </Space>
      </Card>

      <Card title="Loading · Empty · Error states" size="small">
        <div className={styles.controls}>
          <Card title="Loading" size="small" style={{ flex: 1 }}>
            <Skeleton active avatar paragraph={{ rows: 3 }} />
          </Card>
          <Card title="Empty" size="small" style={{ flex: 1 }}>
            <Empty description="No patients in this view yet" />
          </Card>
          <Card title="Error" size="small" style={{ flex: 1 }}>
            <Result status="error" title="Could not load patients" subTitle="Retry in a moment." />
          </Card>
        </div>
      </Card>

      <Card title="Per-widget resilience" size="small">
        <Space direction="vertical" size="small" style={{ display: 'flex' }}>
          <Typography.Paragraph type="secondary">
            One widget failing must never blank the page. Toggle to throw inside an error boundary.
          </Typography.Paragraph>
          <ErrorBoundary key={broken ? 'broken' : 'ok'} fallbackTitle="This widget hit a snag">
            <ExplodingWidget shouldThrow={broken} />
          </ErrorBoundary>
          <Button danger onClick={() => setBroken((previous) => !previous)}>
            {broken ? 'Recover widget' : 'Break this widget'}
          </Button>
        </Space>
      </Card>
    </div>
  );
}
