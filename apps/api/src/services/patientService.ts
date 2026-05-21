import { uuidv7 } from 'uuidv7';
import type { AddressCreateInput, ContactMethodCreateInput, PatientCreateInput, PatientWithRelations } from '@finni/shared';
import { ContactMethodType, DateTimeUtil, SOFT_DELETE_PURGE_DAYS } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { getDb } from '@/db/client';
import { RepositoryScope } from '@/enums/repositoryScope';
import { insertAddressRow } from '@/repositories/addressRepository';
import { insertContactMethodRow } from '@/repositories/contactMethodRepository';
import {
  clearPatientDeleted,
  getPatientById,
  insertPatientRow,
  listPatients,
  markPatientDeleted,
  purgeExpiredPatients,
  setPatientArchived,
  updatePatientRow,
} from '@/repositories/patientRepository';
import type { PatientUpdate } from '@/repositories/patientRepository';

// Business logic + transaction ownership (spec §5). UUID v7 PKs are generated here.

// Create patient + addresses + contacts atomically; a failed child insert rolls back all.
// db is injectable so tests can run the real transaction against an in-process pglite engine.
export async function createPatient(
  input: PatientCreateInput,
  db: AppDatabase = getDb(),
): Promise<PatientWithRelations> {
  const patientId = uuidv7();
  const addresses = ensurePrimaryAddress(input.addresses);
  const contactMethods = ensurePrimaryEmail(input.contactMethods);

  await db.transaction(async (tx) => {
    await insertPatientRow(tx, {
      id: patientId,
      firstName: input.firstName,
      middleName: input.middleName ?? null,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      status: input.status,
      hasInsurance: input.hasInsurance,
    });
    for (const entry of addresses) {
      await insertAddressRow(tx, {
        id: uuidv7(),
        patientId,
        type: entry.type,
        isPrimary: entry.isPrimary,
        line1: entry.line1 ?? null,
        line2: entry.line2 ?? null,
        city: entry.city ?? null,
        region: entry.region,
        postalCode: entry.postalCode ?? null,
        country: entry.country,
      });
    }
    for (const entry of contactMethods) {
      await insertContactMethodRow(tx, {
        id: uuidv7(),
        patientId,
        type: entry.type,
        value: entry.value,
        label: entry.label,
        isPrimary: entry.isPrimary,
      });
    }
  });

  const created = await getPatientById(db, patientId, RepositoryScope.Active);
  if (!created) throw new Error('Patient creation succeeded but the record could not be read back');
  return created;
}

export async function updatePatient(
  id: string,
  patch: PatientUpdate,
  db: AppDatabase = getDb(),
): Promise<PatientWithRelations | null> {
  await updatePatientRow(db, id, patch);
  return getPatientById(db, id, RepositoryScope.IncludeArchived);
}

export async function archivePatient(id: string, db: AppDatabase = getDb()): Promise<void> {
  await setPatientArchived(db, id, true);
}

export async function unarchivePatient(id: string, db: AppDatabase = getDb()): Promise<void> {
  await setPatientArchived(db, id, false);
}

export async function softDeletePatient(id: string, db: AppDatabase = getDb()): Promise<void> {
  await markPatientDeleted(db, id);
}

export async function restorePatient(id: string, db: AppDatabase = getDb()): Promise<void> {
  await clearPatientDeleted(db, id);
}

export async function getPatientList(
  scope: RepositoryScope,
  db: AppDatabase = getDb(),
): Promise<PatientWithRelations[]> {
  return listPatients(db, scope);
}

export async function getPatientDetail(
  id: string,
  scope: RepositoryScope,
  db: AppDatabase = getDb(),
): Promise<PatientWithRelations | null> {
  return getPatientById(db, id, scope);
}

// Remove records past the 30-day window (spec §12). In production this is a scheduled job;
// here it backs the demo "Purge expired" control.
export async function purgeExpiredDeletes(db: AppDatabase = getDb()): Promise<number> {
  const cutoff = DateTimeUtil.subtractDaysUtc(DateTimeUtil.nowUtc(), SOFT_DELETE_PURGE_DAYS);
  return purgeExpiredPatients(db, cutoff);
}

// At least one address is primary; default the first when none was flagged.
function ensurePrimaryAddress(addresses: AddressCreateInput[]): AddressCreateInput[] {
  if (addresses.some((entry) => entry.isPrimary)) return addresses;
  return addresses.map((entry, index) => ({ ...entry, isPrimary: index === 0 }));
}

// At least one email contact is primary; default the first email when none was flagged.
function ensurePrimaryEmail(contactMethods: ContactMethodCreateInput[]): ContactMethodCreateInput[] {
  if (contactMethods.some((entry) => entry.type === ContactMethodType.Email && entry.isPrimary)) {
    return contactMethods;
  }
  const firstEmailIndex = contactMethods.findIndex((entry) => entry.type === ContactMethodType.Email);
  return contactMethods.map((entry, index) => (index === firstEmailIndex ? { ...entry, isPrimary: true } : entry));
}
