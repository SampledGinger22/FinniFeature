import { beforeEach, describe, expect, it } from 'vitest';
import { ContactMethodType, PatientStatus } from '@finni/shared';
import type { PatientWithRelations } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { createMigratedPgliteDb } from '@/test/testDb';
import { seedPatients } from '@/seed/seedData';
import {
  archivePatientRoute,
  createPatientRoute,
  listPatientsRoute,
  purgePatientRoute,
  restorePatientRoute,
  softDeletePatientRoute,
  unarchivePatientRoute,
} from '@/http/patientRoutes';

let db: AppDatabase;

// Fresh seeded db per test so lifecycle mutations never leak across cases (deterministic seed).
beforeEach(async () => {
  db = await createMigratedPgliteDb();
  await seedPatients(db);
});

function patientsOf(result: { body: unknown }): PatientWithRelations[] {
  return (result.body as { patients: PatientWithRelations[] }).patients;
}

function patientOf(result: { body: unknown }): PatientWithRelations {
  return (result.body as { patient: PatientWithRelations }).patient;
}

async function activeIds(): Promise<Set<string>> {
  return new Set(patientsOf(await listPatientsRoute(db)).map((entry) => entry.id));
}

describe('createPatientRoute', () => {
  const validInput = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    dateOfBirth: '1990-12-10',
    status: PatientStatus.Inquiry,
    addresses: [{ region: 'NY', city: 'Brooklyn' }],
    contactMethods: [{ type: ContactMethodType.Email, value: 'ada@example.com' }],
  };

  it('creates a patient with its relations and returns 201', async () => {
    const result = await createPatientRoute(db, validInput);
    expect(result.status).toBe(201);
    const created = patientOf(result);
    expect(created.firstName).toBe('Ada');
    expect(created.addresses[0]?.region).toBe('NY');
    expect(created.contactMethods.some((method) => method.type === ContactMethodType.Email)).toBe(true);
    expect(await activeIds()).toContain(created.id);
  });

  it('rejects a payload missing the required email contact with 422', async () => {
    const result = await createPatientRoute(db, { ...validInput, contactMethods: [] });
    expect(result.status).toBe(422);
  });
});

describe('archive / unarchive', () => {
  it('archive removes the patient from the active list; unarchive restores it', async () => {
    const target = patientsOf(await listPatientsRoute(db))[0]!;

    const archived = await archivePatientRoute(db, target.id);
    expect(archived.status).toBe(200);
    expect(patientOf(archived).archived).toBe(true);
    expect(await activeIds()).not.toContain(target.id);
    expect(patientsOf(await listPatientsRoute(db, 'include-archived')).map((p) => p.id)).toContain(target.id);

    const unarchived = await unarchivePatientRoute(db, target.id);
    expect(patientOf(unarchived).archived).toBe(false);
    expect(await activeIds()).toContain(target.id);
  });
});

describe('soft delete / restore', () => {
  it('soft delete hides from active and include-archived; restore brings it back', async () => {
    const target = patientsOf(await listPatientsRoute(db))[0]!;

    const deleted = await softDeletePatientRoute(db, target.id);
    expect(deleted.status).toBe(200);
    expect(patientOf(deleted).deletedAt).not.toBeNull();
    expect(await activeIds()).not.toContain(target.id);
    expect(patientsOf(await listPatientsRoute(db, 'include-archived')).map((p) => p.id)).not.toContain(target.id);
    expect(patientsOf(await listPatientsRoute(db, 'include-deleted')).map((p) => p.id)).toContain(target.id);

    const restored = await restorePatientRoute(db, target.id);
    expect(patientOf(restored).deletedAt).toBeNull();
    expect(await activeIds()).toContain(target.id);
  });

  it('returns 404 when archiving an unknown id', async () => {
    const result = await archivePatientRoute(db, '00000000-0000-0000-0000-000000000000');
    expect(result.status).toBe(404);
  });
});

describe('purge (permanent delete)', () => {
  it('permanently removes a patient so it is gone from every scope', async () => {
    const target = patientsOf(await listPatientsRoute(db))[0]!;
    await softDeletePatientRoute(db, target.id);

    const purged = await purgePatientRoute(db, target.id);
    expect(purged.status).toBe(200);
    expect((purged.body as { purged: boolean }).purged).toBe(true);
    expect(patientsOf(await listPatientsRoute(db, 'include-deleted')).map((p) => p.id)).not.toContain(target.id);
  });

  it('returns 404 when purging an unknown id', async () => {
    const result = await purgePatientRoute(db, '00000000-0000-0000-0000-000000000000');
    expect(result.status).toBe(404);
  });
});
