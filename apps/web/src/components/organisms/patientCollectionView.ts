import type { PatientWithRelations } from '@finni/shared';

// The contract every caseload view (card/table/board) implements. The switcher owns the
// loading/error/empty states and only mounts a view for the data state, so a view receives a
// ready, already-filtered set. Keeping this shared stops the three views from drifting apart.
export interface PatientCollectionViewProps {
  patients: PatientWithRelations[];
  onEditPatient: (patient: PatientWithRelations) => void;
}
