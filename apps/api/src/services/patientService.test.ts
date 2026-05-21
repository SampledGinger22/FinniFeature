import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactMethodType, patientCreateSchema } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { patient } from '@/db/schema';
import { RepositoryScope } from '@/enums/repositoryScope';
import * as contactMethodRepository from '@/repositories/contactMethodRepository';
import { listPatients } from '@/repositories/patientRepository';
import { createPatient } from '@/services/patientService';
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
