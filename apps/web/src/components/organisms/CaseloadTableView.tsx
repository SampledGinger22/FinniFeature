import { Alert } from 'antd';
import type { PatientCollectionViewProps } from '@/components/organisms/patientCollectionView';

// Placeholder — replaced by the Table view stream in Step 5. Implements the shared view contract
// so the switcher type-checks before the real implementation lands.
export function CaseloadTableView({ patients }: PatientCollectionViewProps): JSX.Element {
  return <Alert type="info" message={`Table view coming in Step 5 (${patients.length} patients)`} />;
}
