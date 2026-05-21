import { PatientStatus } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';

// Shape returned by summarizeCaseload; byStatus covers all six statuses (zero if none).
export interface CaseloadSummary {
  total: number;
  byStatus: Record<PatientStatus, number>;
  insured: number;
  uninsured: number;
  needsAttention: PatientWithRelations[];
}

// Statuses treated as "needs attention" — patients early in the funnel, not yet in active care.
const ATTENTION_STATUSES: ReadonlySet<PatientStatus> = new Set([
  PatientStatus.Inquiry,
  PatientStatus.Waitlisted,
]);

// Pure caseload aggregation — no side effects, no imports from React or antd. Easy to unit-test.
export function summarizeCaseload(patients: PatientWithRelations[]): CaseloadSummary {
  const byStatus: Record<PatientStatus, number> = {
    [PatientStatus.Inquiry]: 0,
    [PatientStatus.Waitlisted]: 0,
    [PatientStatus.Onboarding]: 0,
    [PatientStatus.Active]: 0,
    [PatientStatus.Paused]: 0,
    [PatientStatus.Churned]: 0,
  };

  let insured = 0;
  const needsAttention: PatientWithRelations[] = [];

  for (const patient of patients) {
    byStatus[patient.status] += 1;
    if (patient.hasInsurance) insured += 1;
    if (ATTENTION_STATUSES.has(patient.status)) needsAttention.push(patient);
  }

  return {
    total: patients.length,
    byStatus,
    insured,
    uninsured: patients.length - insured,
    needsAttention,
  };
}
