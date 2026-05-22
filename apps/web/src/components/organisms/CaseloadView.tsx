import { Alert, Button, Card, Empty, Skeleton } from 'antd';
import type { PatientWithRelations } from '@finni/shared';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { CaseloadViewMode } from '@/enums/caseloadViewMode';
import { CaseloadCardView } from '@/components/organisms/CaseloadCardView';
import { CaseloadTableView } from '@/components/organisms/CaseloadTableView';
import { useCaseloadViewStyles } from '@/components/organisms/CaseloadView.styles';

interface CaseloadViewProps {
  patients: PatientWithRelations[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEditPatient: (patient: PatientWithRelations) => void;
}

const SKELETON_COUNT = 8;

// One presentation layer with explicit loading / error / empty / data states (§8). It owns those
// states once for both views, then delegates the data state to the active view by mode — the
// views are presentation only, reading the SAME filtered set, so switching never refetches.
export function CaseloadView({ patients, isLoading, isError, onRetry, onEditPatient }: CaseloadViewProps): JSX.Element {
  const { styles } = useCaseloadViewStyles();
  const viewMode = useCaseloadStore((state) => state.viewMode);

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
    return <Empty description="No patients match these filters" />;
  }

  if (viewMode === CaseloadViewMode.Table) {
    return <CaseloadTableView patients={patients} onEditPatient={onEditPatient} />;
  }
  return <CaseloadCardView patients={patients} onEditPatient={onEditPatient} />;
}
