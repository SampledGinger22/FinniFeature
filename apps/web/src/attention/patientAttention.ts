import { PatientStatus } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';

// Derived "needs attention" reason for the caseload table and the daily banner. No scheduling or
// audit data exists in the domain yet, so the reason is derived from real signals (status,
// insurance) plus a stable id-hash for variety — never random, so a patient reads the same across
// renders and views. Returns null when nothing is flagged.

const CARE_STAGES: readonly PatientStatus[] = [
  PatientStatus.Onboarding,
  PatientStatus.Active,
  PatientStatus.Paused,
];

// Same plain string hash used for avatar colors: deterministic bucketing, not randomness.
function stableBucket(id: string, modulo: number): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % modulo;
}

export function derivePatientAttention(patient: PatientWithRelations): string | null {
  if (patient.status === PatientStatus.Inquiry) return 'Awaiting intake call';
  if (patient.status === PatientStatus.Waitlisted) return 'Review waitlist placement';
  if (!patient.hasInsurance && CARE_STAGES.includes(patient.status)) return 'Insurance not on file';
  // A deterministic minority of insured, in-care patients have an upcoming authorization review.
  if (CARE_STAGES.includes(patient.status) && stableBucket(patient.id, 4) === 0) {
    return 'Insurance auth expires this week';
  }
  return null;
}
