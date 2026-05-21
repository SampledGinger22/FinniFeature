import { Alert } from 'antd';
import type { PatientCollectionViewProps } from '@/components/organisms/patientCollectionView';

// Placeholder — replaced by the Board view stream in Step 5. Implements the shared view contract
// so the switcher type-checks before the real implementation lands.
export function CaseloadBoardView({ patients }: PatientCollectionViewProps): JSX.Element {
  return <Alert type="info" message={`Board view coming in Step 5 (${patients.length} patients)`} />;
}
