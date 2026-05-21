import { PatientCard } from '@/components/molecules/PatientCard';
import type { PatientCollectionViewProps } from '@/components/organisms/patientCollectionView';
import { useCaseloadCardViewStyles } from '@/components/organisms/CaseloadCardView.styles';

// Photo-forward card grid — the default of the three caseload views (§8). Receives an
// already-filtered, non-empty set; the switcher owns loading/error/empty.
export function CaseloadCardView({ patients, onEditPatient }: PatientCollectionViewProps): JSX.Element {
  const { styles } = useCaseloadCardViewStyles();
  return (
    <div className={styles.grid}>
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} onEdit={onEditPatient} />
      ))}
    </div>
  );
}
