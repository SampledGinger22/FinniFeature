import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactMethodType, PatientStatus, patientCreateSchema, patientUpdateSchema } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { patient } from '@/db/schema';
import { RepositoryScope } from '@/enums/repositoryScope';
import * as contactMethodRepository from '@/repositories/contactMethodRepository';
import { listPatients } from '@/repositories/patientRepository';
import { createPatient, updatePatient } from '@/services/patientService';
import { createMigratedPgliteDb } from '@/test/testDb';

// Wrap the contact insert (delegates to the real impl) so one test can force it to fail.
vi.mock('@/repositories/contactMethodRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/repositories/contactMethodRepository')>();
  return { ...actual, insertContactMethodRow: vi.fn(actual.insertContactMethodRow) };
});

let db: AppDatabase;

beforeAll(async () => {
  db = await createMigratedPgliteDb();
});

beforeEach(async () => {
  vi.mocked(contactMethodRepository.insertContactMethodRow).mockClear();
  await db.delete(patient);
});

function buildInput() {
  return patientCreateSchema.parse({
    firstName: 'Ada',
    lastName: 'Lovelace',
    dateOfBirth: '1990-12-10',
    addresses: [{ region: 'NY', city: 'New York' }],
    contactMethods: [
      { type: ContactMethodType.Email, value: 'ada@example.com' },
      { type: ContactMethodType.Phone, value: '+1 212 555 0142' },
    ],
  });
}

describe('createPatient — atomic transaction', () => {
  it('creates patient + address + contacts and reads them back decrypted', async () => {
    const created = await createPatient(buildInput(), db);
    expect(created.firstName).toBe('Ada');
    expect(created.addresses).toHaveLength(1);
    expect(created.addresses[0]?.region).toBe('NY');
    expect(created.contactMethods).toHaveLength(2);
  });

  it('defaults a primary address and a primary email', async () => {
    const created = await createPatient(buildInput(), db);
    expect(created.addresses[0]?.isPrimary).toBe(true);
    const email = created.contactMethods.find((entry) => entry.type === ContactMethodType.Email);
    expect(email?.isPrimary).toBe(true);
  });

  it('rolls back the patient when a child insert fails', async () => {
    vi.mocked(contactMethodRepository.insertContactMethodRow).mockRejectedValueOnce(
      new Error('forced child-insert failure'),
    );
    await expect(createPatient(buildInput(), db)).rejects.toThrow();

    // The whole transaction must unwind — no orphaned patient, address, or contact.
    const all = await listPatients(db, RepositoryScope.IncludeDeleted);
    expect(all).toHaveLength(0);
  });
});

function updateInput(overrides: Record<string, unknown>) {
  return patientUpdateSchema.parse({
    firstName: 'Ada',
    middleName: null,
    lastName: 'Lovelace',
    dateOfBirth: '1990-12-10',
    status: PatientStatus.Active,
    hasInsurance: true,
    ...overrides,
  });
}

describe('updatePatient — patient + address + contacts', () => {
  it('updates the primary address in place (re-encrypting street-level PHI)', async () => {
    const created = await createPatient(buildInput(), db);
    const updated = await updatePatient(
      created.id,
      updateInput({ primaryAddress: { line1: '1 Test St', city: 'Albany', region: 'NY', postalCode: '12207' } }),
      db,
    );
    expect(updated?.addresses[0]?.line1).toBe('1 Test St');
    expect(updated?.addresses[0]?.city).toBe('Albany');
    expect(updated?.addresses[0]?.postalCode).toBe('12207');
  });

  it('updates the primary email value', async () => {
    const created = await createPatient(buildInput(), db);
    const updated = await updatePatient(created.id, updateInput({ primaryEmail: 'ada.new@example.com' }), db);
    const email = updated?.contactMethods.find((entry) => entry.type === ContactMethodType.Email);
    expect(email?.value).toBe('ada.new@example.com');
  });

  it('removes the phone contact when cleared to null', async () => {
    const created = await createPatient(buildInput(), db);
    const updated = await updatePatient(created.id, updateInput({ phone: null }), db);
    expect(updated?.contactMethods.some((entry) => entry.type === ContactMethodType.Phone)).toBe(false);
  });

  it('adds a phone contact when none exists', async () => {
    const created = await createPatient(
      patientCreateSchema.parse({
        firstName: 'No',
        lastName: 'Phone',
        dateOfBirth: '1990-01-01',
        addresses: [{ region: 'TX' }],
        contactMethods: [{ type: ContactMethodType.Email, value: 'np@example.com' }],
      }),
      db,
    );
    const updated = await updatePatient(created.id, updateInput({ phone: '+1 415 555 0001' }), db);
    const phone = updated?.contactMethods.find((entry) => entry.type === ContactMethodType.Phone);
    expect(phone?.value).toBe('+1 415 555 0001');
  });
});
