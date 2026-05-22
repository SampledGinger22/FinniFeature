import { useState } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { PatientWithRelations } from '@finni/shared';
import { CaseloadViewSwitcher } from '@/components/molecules/CaseloadViewSwitcher';
import { PageHeader } from '@/components/molecules/PageHeader';
import { ErrorBoundary } from '@/components/molecules/ErrorBoundary';
import { CaseloadFilterBar } from '@/components/organisms/CaseloadFilterBar';
import { CaseloadView } from '@/components/organisms/CaseloadView';
import { PatientCreateDrawer } from '@/components/organisms/PatientCreateDrawer';
import { PatientEditDrawer } from '@/components/organisms/PatientEditDrawer';
import { useCaseloadStore } from '@/state/useCaseloadStore';
import { useFilteredPatients } from '@/hooks/useFilteredPatients';
import { usePatientListQuery } from '@/queries/patientQueries';

// The caseload workspace: scope (a server dimension) drives the query; the hero filters then run
// client-side over that loaded set, feeding one filtered result to whichever view is active. Each
// region has its own error boundary so one failing widget never blanks the page (§8).
export function CaseloadPage(): JSX.Element {
  const scope = useCaseloadStore((state) => state.scope);
  const query = usePatientListQuery(scope);
  const { patients, facets, totalLoaded, matchCount } = useFilteredPatients(query.data);

  const [editingPatient, setEditingPatient] = useState<PatientWithRelations | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const openEditor = (patient: PatientWithRelations): void => {
    setEditingPatient(patient);
    setEditOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Caseload"
        actions={
          <Space>
            <CaseloadViewSwitcher />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Add patient
            </Button>
          </Space>
        }
      />

      <ErrorBoundary fallbackTitle="Filters are unavailable">
        <CaseloadFilterBar facets={facets} totalLoaded={totalLoaded} matchCount={matchCount} />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="The caseload could not be displayed">
        <CaseloadView
          patients={patients}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          onEditPatient={openEditor}
        />
      </ErrorBoundary>

      <PatientEditDrawer patient={editingPatient} open={editOpen} onClose={() => setEditOpen(false)} />
      <PatientCreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
