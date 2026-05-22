import { useMemo, useState } from 'react';
import { Alert, Button, Empty, Skeleton, Typography } from 'antd';
import { RepositoryScope } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';
import { PageHeader } from '@/components/molecules/PageHeader';
import { ErrorBoundary } from '@/components/molecules/ErrorBoundary';
import { CaseloadTableView } from '@/components/organisms/CaseloadTableView';
import { PatientEditDrawer } from '@/components/organisms/PatientEditDrawer';
import { usePatientListQuery } from '@/queries/patientQueries';

const SKELETON_ROWS = 4;

// Trash: only soft-deleted patients, always the table view (no card/board). Each row's actions menu
// offers Restore or permanent delete. Lives off Settings, separate from the active caseload.
export function TrashPage(): JSX.Element {
  const query = usePatientListQuery(RepositoryScope.IncludeDeleted);
  // The include-deleted scope returns everything; keep only the genuinely soft-deleted here.
  const deleted = useMemo(
    () => (query.data ?? []).filter((patient) => patient.deletedAt !== null),
    [query.data],
  );

  const [editingPatient, setEditingPatient] = useState<PatientWithRelations | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const openEditor = (patient: PatientWithRelations): void => {
    setEditingPatient(patient);
    setEditOpen(true);
  };

  const renderContent = (): JSX.Element => {
    if (query.isError) {
      return (
        <Alert
          type="error"
          showIcon
          message="Could not load Trash"
          description="Something went wrong fetching deleted patients."
          action={
            <Button size="small" onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        />
      );
    }
    if (query.isLoading) {
      return <Skeleton active paragraph={{ rows: SKELETON_ROWS }} />;
    }
    if (deleted.length === 0) {
      return <Empty description="Trash is empty" />;
    }
    return <CaseloadTableView patients={deleted} onEditPatient={openEditor} />;
  };

  return (
    <>
      <PageHeader title="Trash" />
      <Typography.Paragraph type="secondary">
        Soft-deleted patients are purged 30 days after deletion. Restore them or delete permanently.
      </Typography.Paragraph>
      <ErrorBoundary fallbackTitle="Trash could not be displayed">{renderContent()}</ErrorBoundary>
      <PatientEditDrawer patient={editingPatient} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
