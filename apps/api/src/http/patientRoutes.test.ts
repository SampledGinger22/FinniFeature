import { beforeAll, describe, expect, it } from 'vitest';
import { PatientStatus } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { createMigratedPgliteDb } from '@/test/testDb';
import { seedPatients } from '@/seed/seedData';
import { getPatientRoute, listPatientsRoute, updatePatientRoute } from '@/http/patientRoutes';

let db: AppDatabase;

beforeAll(async () => {
  db = await createMigratedPgliteDb();
  await seedPatients(db);
});

function patientsOf(result: { body: unknown }): PatientWithRelations[] {
  return (result.body as { patients: PatientWithRelations[] }).patients;
}

describe('listPatientsRoute', () => {
  it('defaults to active scope — archived and soft-deleted are hidden', async () => {
    const result = await listPatientsRoute(db);
    expect(result.status).toBe(200);
    // 36 seeded; 1 archived + 1 soft-deleted are excluded from the active default.
    expect(patientsOf(result)).toHaveLength(34);
  });

  it('includes archived when scope=include-archived', async () => {
    const result = await listPatientsRoute(db, 'include-archived');
    expect(patientsOf(result).length).toBeGreaterThan(34);
  });
});

describe('updatePatientRoute', () => {
  it('updates core fields and returns the new record', async () => {
    const target = patientsOf(await listPatientsRoute(db))[0]!;
    const result = await updatePatientRoute(db, target.id, {
      firstName: 'Renamed',
      middleName: null,
      lastName: target.lastName,
      dateOfBirth: target.dateOfBirth,
      status: PatientStatus.Active,
      hasInsurance: true,
    });
    expect(result.status).toBe(200);
    const updated = (result.body as { patient: PatientWithRelations }).patient;
    expect(updated.firstName).toBe('Renamed');
    expect(updated.status).toBe(PatientStatus.Active);
  });

  it('rejects an invalid payload with 422', async () => {
    const target = patientsOf(await listPatientsRoute(db))[0]!;
    const result = await updatePatientRoute(db, target.id, { firstName: '' });
    expect(result.status).toBe(422);
  });
});

describe('getPatientRoute', () => {
  it('returns 404 for an unknown id', async () => {
    const result = await getPatientRoute(db, '00000000-0000-0000-0000-000000000000');
    expect(result.status).toBe(404);
  });
});
