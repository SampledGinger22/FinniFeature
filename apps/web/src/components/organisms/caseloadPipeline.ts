import { PatientStatus } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';

export interface PipelineSegment {
  status: PatientStatus;
  count: number;
}

// Per-status counts over the loaded set, in lifecycle order. Pure and unit-tested so the pipeline
// bar's widths/counts are derived identically to the rest of the caseload layer (parallels
// caseloadBoard.ts). Counts reflect the loaded scope, not the active filter, so the bar shows the
// shape of the caseload while filtering narrows the rows below it.
export function derivePipelineSegments(patients: PatientWithRelations[]): PipelineSegment[] {
  const counts = {} as Record<PatientStatus, number>;
  for (const status of Object.values(PatientStatus)) {
    counts[status] = 0;
  }
  for (const patient of patients) {
    counts[patient.status] += 1;
  }
  return Object.values(PatientStatus).map((status) => ({ status, count: counts[status] }));
}
