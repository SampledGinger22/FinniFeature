import { PatientStatus } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';

// Column order is the lifecycle order from the shared enum, so the board never hardcodes or
// reorders statuses independently of the source of truth (§6.4).
export const caseloadBoardColumns: PatientStatus[] = Object.values(PatientStatus);

// Buckets the loaded set into one list per status; pure so the render and its test agree.
// Every column key exists even when empty, so empty columns still render a drop target.
export function groupPatientsByStatus(
  patients: PatientWithRelations[],
): Record<PatientStatus, PatientWithRelations[]> {
  const groups = Object.fromEntries(
    caseloadBoardColumns.map((status) => [status, [] as PatientWithRelations[]]),
  ) as Record<PatientStatus, PatientWithRelations[]>;
  for (const patient of patients) {
    groups[patient.status].push(patient);
  }
  return groups;
}

function isPatientStatus(value: string): value is PatientStatus {
  return (caseloadBoardColumns as string[]).includes(value);
}

export interface StatusChange {
  patient: PatientWithRelations;
  newStatus: PatientStatus;
}

// Resolves a drag-end into a real status move, or null when it is a no-op (no drop target,
// unknown patient, or dropped back on its current column). Pure so drag logic is testable.
export function resolveStatusChange(
  activeId: string,
  overStatus: string | null,
  patients: PatientWithRelations[],
): StatusChange | null {
  if (overStatus === null || !isPatientStatus(overStatus)) return null;
  const patient = patients.find((candidate) => candidate.id === activeId);
  if (!patient || patient.status === overStatus) return null;
  return { patient, newStatus: overStatus };
}
