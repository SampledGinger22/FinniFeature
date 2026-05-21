import { Alert, Drawer } from 'antd';

interface PatientCreateDrawerProps {
  open: boolean;
  onClose: () => void;
}

// Placeholder for the create flow (bottom drawer, §8) — replaced by the create-flow stream in
// Step 5. Create = bottom drawer, mirroring edit = right drawer.
export function PatientCreateDrawer({ open, onClose }: PatientCreateDrawerProps): JSX.Element {
  return (
    <Drawer title="Add patient" placement="bottom" open={open} onClose={onClose} height="60%">
      <Alert type="info" message="Create form coming in Step 5" />
    </Drawer>
  );
}
