import { useState } from 'react';
import { Typography } from 'antd';
import type { PatientWithRelations } from '@finni/shared';
import { BrandLogo } from '@/components/atoms/BrandLogo';
import { ErrorBoundary } from '@/components/molecules/ErrorBoundary';
import { CaseloadView } from '@/components/organisms/CaseloadView';
import { PatientEditDrawer } from '@/components/organisms/PatientEditDrawer';
import { usePatientListQuery } from '@/queries/patientQueries';
import { useCaseloadPageStyles } from '@/pages/CaseloadPage.styles';

// The vertical slice (build order §15.4): real data via TanStack Query → card grid with all
// states → edit drawer → mutation → invalidate. This is the pattern Step 5 copies.
export function CaseloadPage(): JSX.Element {
  const { styles } = useCaseloadPageStyles();
  const query = usePatientListQuery();
  const [editingPatient, setEditingPatient] = useState<PatientWithRelations | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openEditor = (patient: PatientWithRelations): void => {
    setEditingPatient(patient);
    setDrawerOpen(true);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <BrandLogo />
        <Typography.Title level={3} className={styles.title}>
          Caseload
        </Typography.Title>
      </header>
      <ErrorBoundary fallbackTitle="The caseload could not be displayed">
        <CaseloadView
          patients={query.data}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          onEditPatient={openEditor}
        />
      </ErrorBoundary>
      <PatientEditDrawer patient={editingPatient} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
