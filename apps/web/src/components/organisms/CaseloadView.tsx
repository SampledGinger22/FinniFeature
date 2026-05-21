import { Alert, Button, Card, Empty, Skeleton } from 'antd';
import type { PatientWithRelations } from '@finni/shared';
import { PatientCard } from '@/components/molecules/PatientCard';
import { useCaseloadViewStyles } from '@/components/organisms/CaseloadView.styles';

interface CaseloadViewProps {
  patients: PatientWithRelations[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEditPatient: (patient: PatientWithRelations) => void;
}

const SKELETON_COUNT = 8;

// One presentation layer with explicit loading / error / empty / data states (§8). The card grid
// is the default view; table and board (Step 5) will read the same data through this contract.
export function CaseloadView({ patients, isLoading, isError, onRetry, onEditPatient }: CaseloadViewProps): JSX.Element {
  const { styles } = useCaseloadViewStyles();

  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load patients"
        description="Something went wrong fetching the caseload."
        action={
          <Button size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className={styles.grid} aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }, (_unused, index) => (
          <Card key={index}>
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (!patients || patients.length === 0) {
    return <Empty description="No patients in this view yet" />;
  }

  return (
    <div className={styles.grid}>
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} onEdit={onEditPatient} />
      ))}
    </div>
  );
}
