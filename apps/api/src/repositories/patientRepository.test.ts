import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { AddressType, ContactLabel, ContactMethodType, DateTimeUtil, PatientStatus } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { patient } from '@/db/schema';
import { RepositoryScope } from '@/enums/repositoryScope';
import { insertAddressRow } from '@/repositories/addressRepository';
import { insertContactMethodRow } from '@/repositories/contactMethodRepository';
import {
  getPatientById,
  insertPatientRow,
  listPatients,
  markPatientDeleted,
  purgeExpiredPatients,
  setPatientArchived,
} from '@/repositories/patientRepository';
import type { PatientInsert } from '@/repositories/patientRepository';
import { createMigratedPgliteDb } from '@/test/testDb';

let db: AppDatabase;

beforeAll(async () => {
  db = await createMigratedPgliteDb();
});

beforeEach(async () => {
  await db.delete(patient);
});

async function insertPatient(overrides: Partial<PatientInsert> = {}): Promise<string> {
  const id = uuidv7();
  await insertPatientRow(db, {
    id,
    firstName: 'Ada',
    middleName: null,
    lastName: 'Lovelace',
    dateOfBirth: '1990-01-01',
    status: PatientStatus.Active,
    hasInsurance: false,
    ...overrides,
  });
  return id;
}

describe('patientRepository scope', () => {
  it('Active excludes archived and soft-deleted', async () => {
    await insertPatient();
    const archivedId = await insertPatient();
    await setPatientArchived(db, archivedId, true);
    const deletedId = await insertPatient();
    await markPatientDeleted(db, deletedId);

    const active = await listPatients(db, RepositoryScope.Active);
    expect(active).toHaveLength(1);
  });

  it('IncludeArchived returns live archived + non-archived but not deleted', async () => {
    await insertPatient();
    const archivedId = await insertPatient();
    await setPatientArchived(db, archivedId, true);
    const deletedId = await insertPatient();
    await markPatientDeleted(db, deletedId);

    const rows = await listPatients(db, RepositoryScope.IncludeArchived);
    expect(rows).toHaveLength(2);
  });

  it('IncludeDeleted returns everything', async () => {
    await insertPatient();
    const archivedId = await insertPatient();
    await setPatientArchived(db, archivedId, true);
    const deletedId = await insertPatient();
    await markPatientDeleted(db, deletedId);

    const rows = await listPatients(db, RepositoryScope.IncludeDeleted);
    expect(rows).toHaveLength(3);
  });

  it('getPatientById honors scope', async () => {
    const archivedId = await insertPatient();
    await setPatientArchived(db, archivedId, true);

    expect(await getPatientById(db, archivedId, RepositoryScope.Active)).toBeNull();
    expect(await getPatientById(db, archivedId, RepositoryScope.IncludeArchived)).not.toBeNull();
  });
});

describe('patientRepository PHI encryption', () => {
  it('round-trips name through encrypt-on-write / decrypt-on-read', async () => {
    const id = await insertPatient({ firstName: 'Grace', lastName: 'Hopper' });
    const read = await getPatientById(db, id, RepositoryScope.Active);
    expect(read?.firstName).toBe('Grace');
    expect(read?.lastName).toBe('Hopper');
  });

  it('stores ciphertext, not plaintext, in the column', async () => {
    const id = await insertPatient({ firstName: 'Katherine' });
    const raw = await db.select().from(patient).where(eq(patient.id, id));
    expect(raw[0]?.firstName).not.toBe('Katherine');
    expect((raw[0]?.firstName ?? '').length).toBeGreaterThan('Katherine'.length);
  });

  it('keeps date_of_birth and region queryable (plaintext) for the hero filter', async () => {
    const id = await insertPatient({ dateOfBirth: '2000-05-01' });
    await insertAddressRow(db, {
      id: uuidv7(),
      patientId: id,
      type: AddressType.Home,
      isPrimary: true,
      line1: '1 Infinite Loop',
      line2: null,
      city: 'New York',
      region: 'NY',
      postalCode: '10001',
      country: 'US',
    });
    const raw = await db.select().from(patient).where(eq(patient.id, id));
    expect(raw[0]?.dateOfBirth).toBe('2000-05-01');

    const read = await getPatientById(db, id, RepositoryScope.Active);
    expect(read?.addresses[0]?.region).toBe('NY');
    // Street line is encrypted but round-trips through the repository.
    expect(read?.addresses[0]?.line1).toBe('1 Infinite Loop');
  });

  it('decrypts contact values on read', async () => {
    const id = await insertPatient();
    await insertContactMethodRow(db, {
      id: uuidv7(),
      patientId: id,
      type: ContactMethodType.Email,
      value: 'grace@example.com',
      label: ContactLabel.Work,
      isPrimary: true,
    });
    const read = await getPatientById(db, id, RepositoryScope.Active);
    expect(read?.contactMethods[0]?.value).toBe('grace@example.com');
  });
});

describe('patientRepository purge', () => {
  it('removes records past the cutoff and keeps recent ones', async () => {
    const oldId = await insertPatient();
    await markPatientDeleted(db, oldId);
    // Backdate the deletion well past the window.
    await db
      .update(patient)
      .set({ deletedAt: DateTimeUtil.subtractDaysUtc(DateTimeUtil.nowUtc(), 60) })
      .where(eq(patient.id, oldId));

    const recentId = await insertPatient();
    await markPatientDeleted(db, recentId);

    const cutoff = DateTimeUtil.subtractDaysUtc(DateTimeUtil.nowUtc(), 30);
    const purged = await purgeExpiredPatients(db, cutoff);
    expect(purged).toBe(1);
    expect(await getPatientById(db, oldId, RepositoryScope.IncludeDeleted)).toBeNull();
    expect(await getPatientById(db, recentId, RepositoryScope.IncludeDeleted)).not.toBeNull();
  });
});
