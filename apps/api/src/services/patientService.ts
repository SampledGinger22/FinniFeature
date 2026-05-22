import { uuidv7 } from 'uuidv7';
import type {
  AddressCreateInput,
  ContactMethodCreateInput,
  PatientCreateInput,
  PatientUpdateInput,
  PatientWithRelations,
} from '@finni/shared';
import { ContactLabel, ContactMethodType, DateTimeUtil, SOFT_DELETE_PURGE_DAYS } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { getDb } from '@/db/client';
import { RepositoryScope } from '@/enums/repositoryScope';
import { insertAddressRow, updatePrimaryAddressRow } from '@/repositories/addressRepository';
import {
  deleteContactMethodRow,
  findContactIdByType,
  insertContactMethodRow,
  updateContactValueRow,
} from '@/repositories/contactMethodRepository';
import {
  clearPatientDeleted,
  deletePatientRow,
  getPatientById,
  insertPatientRow,
  listPatients,
  markPatientDeleted,
  purgeExpiredPatients,
  setPatientArchived,
  updatePatientRow,
} from '@/repositories/patientRepository';

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

// Update the patient row and, when present, the primary address and email/phone contacts — all in
// one transaction so a partial edit never persists. Phone null/cleared removes the phone contact;
// a new phone is inserted when none exists.
export async function updatePatient(
  id: string,
  patch: PatientUpdateInput,
  db: AppDatabase = getDb(),
): Promise<PatientWithRelations | null> {
  await db.transaction(async (tx) => {
    await updatePatientRow(tx, id, {
      firstName: patch.firstName,
      middleName: patch.middleName,
      lastName: patch.lastName,
      dateOfBirth: patch.dateOfBirth,
      status: patch.status,
      hasInsurance: patch.hasInsurance,
    });
    if (patch.primaryAddress) {
      await updatePrimaryAddressRow(tx, id, patch.primaryAddress);
    }
    if (patch.primaryEmail !== undefined) {
      const emailId = await findContactIdByType(tx, id, ContactMethodType.Email);
      if (emailId) await updateContactValueRow(tx, emailId, patch.primaryEmail);
    }
    if (patch.phone !== undefined) {
      const phoneId = await findContactIdByType(tx, id, ContactMethodType.Phone);
      if (patch.phone === null) {
        if (phoneId) await deleteContactMethodRow(tx, phoneId);
      } else if (phoneId) {
        await updateContactValueRow(tx, phoneId, patch.phone);
      } else {
        await insertContactMethodRow(tx, {
          id: uuidv7(),
          patientId: id,
          type: ContactMethodType.Phone,
          value: patch.phone,
          label: ContactLabel.Mobile,
          isPrimary: false,
        });
      }
    }
  });
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

// Permanently remove one patient now (the Trash "Delete permanently" action). Returns false when
// the id does not exist so the handler can 404. Irreversible — the UI gates it behind a warning.
export async function purgePatient(id: string, db: AppDatabase = getDb()): Promise<boolean> {
  return deletePatientRow(db, id);
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
