import { describe, expect, it } from 'vitest';
import { PatientStatus } from '@finni/shared';
import { buildPatient } from '@/test/patientFixture';
import { derivePatientAttention } from '@/attention/patientAttention';

describe('derivePatientAttention', () => {
  it('flags inquiry patients to await an intake call', () => {
    const patient = buildPatient({ id: 'p1', status: PatientStatus.Inquiry });
    expect(derivePatientAttention(patient)).toBe('Awaiting intake call');
  });

  it('flags waitlisted patients to review placement', () => {
    const patient = buildPatient({ id: 'p1', status: PatientStatus.Waitlisted });
    expect(derivePatientAttention(patient)).toBe('Review waitlist placement');
  });

  it('flags in-care patients without insurance', () => {
    const patient = buildPatient({ id: 'p1', status: PatientStatus.Active, hasInsurance: false });
    expect(derivePatientAttention(patient)).toBe('Insurance not on file');
  });

  it('returns null for churned patients (nothing to action)', () => {
    const patient = buildPatient({ id: 'p1', status: PatientStatus.Churned, hasInsurance: true });
    expect(derivePatientAttention(patient)).toBeNull();
  });

  it('is deterministic — the same patient always yields the same reason', () => {
    const patient = buildPatient({ id: 'stable-id', status: PatientStatus.Active, hasInsurance: true });
    expect(derivePatientAttention(patient)).toBe(derivePatientAttention(patient));
  });
});
