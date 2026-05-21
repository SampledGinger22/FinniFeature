import { Alert } from 'antd';

// Placeholder for the demo controls (Purge expired / Reseed / Blank slate, §12) — replaced by the
// demo-controls stream in Step 5. Confirm-gated, clearly separated, would not exist in production.
export function DemoControls(): JSX.Element {
  return <Alert type="warning" message="Demo controls coming in Step 5" />;
}
