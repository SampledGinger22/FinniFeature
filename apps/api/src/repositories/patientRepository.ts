import { and, eq, isNotNull, isNull, lt } from 'drizzle-orm';
import type { Patient, PatientStatus, PatientWithRelations } from '@finni/shared';
import { DateTimeUtil } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { patient } from '@/db/schema';
import { decryptNullablePhi, decryptPhi, encryptNullablePhi, encryptPhi } from '@/crypto/phiCipher';
import { RepositoryScope } from '@/enums/repositoryScope';
import { findAddressesByPatientIds } from '@/repositories/addressRepository';
import { findContactMethodsByPatientIds } from '@/repositories/contactMethodRepository';

type PatientRow = typeof patient.$inferSelect;

export interface PatientInsert {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string;
  status: PatientStatus;
  hasInsurance: boolean;
}

export interface PatientUpdate {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  dateOfBirth?: string;
  status?: PatientStatus;
  hasInsurance?: boolean;
}

// Scope is the PHI-leak guard: Active hides archived + deleted, IncludeArchived hides only
// deleted, IncludeDeleted hides nothing. Returns undefined when no predicate is needed.
function scopeCondition(scope: RepositoryScope) {
  if (scope === RepositoryScope.Active) {
    return and(isNull(patient.deletedAt), eq(patient.archived, false));
  }
  if (scope === RepositoryScope.IncludeArchived) {
    return isNull(patient.deletedAt);
  }
  return undefined;
}

export async function insertPatientRow(db: AppDatabase, values: PatientInsert): Promise<void> {
  await db.insert(patient).values({
    id: values.id,
    firstName: encryptPhi(values.firstName),
    middleName: encryptNullablePhi(values.middleName),
    lastName: encryptPhi(values.lastName),
    dateOfBirth: values.dateOfBirth,
    status: values.status,
    hasInsurance: values.hasInsurance,
  });
}

export async function updatePatientRow(db: AppDatabase, id: string, input: PatientUpdate): Promise<void> {
  const set: Partial<typeof patient.$inferInsert> = { updatedAt: DateTimeUtil.nowUtc() };
  if (input.firstName !== undefined) set.firstName = encryptPhi(input.firstName);
  if (input.middleName !== undefined) set.middleName = encryptNullablePhi(input.middleName);
  if (input.lastName !== undefined) set.lastName = encryptPhi(input.lastName);
  if (input.dateOfBirth !== undefined) set.dateOfBirth = input.dateOfBirth;
  if (input.status !== undefined) set.status = input.status;
  if (input.hasInsurance !== undefined) set.hasInsurance = input.hasInsurance;
  await db.update(patient).set(set).where(eq(patient.id, id));
}

export async function setPatientArchived(db: AppDatabase, id: string, archived: boolean): Promise<void> {
  await db.update(patient).set({ archived, updatedAt: DateTimeUtil.nowUtc() }).where(eq(patient.id, id));
}

export async function markPatientDeleted(db: AppDatabase, id: string): Promise<void> {
  const now = DateTimeUtil.nowUtc();
  await db.update(patient).set({ deletedAt: now, updatedAt: now }).where(eq(patient.id, id));
}

export async function clearPatientDeleted(db: AppDatabase, id: string): Promise<void> {
  await db.update(patient).set({ deletedAt: null, updatedAt: DateTimeUtil.nowUtc() }).where(eq(patient.id, id));
}

// Hard-delete records past the purge window; cascades remove their addresses/contacts (§12).
export async function purgeExpiredPatients(db: AppDatabase, cutoffIso: string): Promise<number> {
  const deleted = await db
    .delete(patient)
    .where(and(isNotNull(patient.deletedAt), lt(patient.deletedAt, cutoffIso)))
    .returning({ id: patient.id });
  return deleted.length;
}

export async function listPatients(db: AppDatabase, scope: RepositoryScope): Promise<PatientWithRelations[]> {
  const condition = scopeCondition(scope);
  const query = db.select().from(patient);
  const rows = condition ? await query.where(condition) : await query;
  return assemble(db, rows);
}

export async function getPatientById(
  db: AppDatabase,
  id: string,
  scope: RepositoryScope,
): Promise<PatientWithRelations | null> {
  const condition = scopeCondition(scope);
  const where = condition ? and(eq(patient.id, id), condition) : eq(patient.id, id);
  const rows = await db.select().from(patient).where(where);
  if (rows.length === 0) return null;
  const assembled = await assemble(db, rows);
  return assembled[0] ?? null;
}

// One query for patients, one for all their addresses, one for all their contacts — then
// group in memory. Three queries total regardless of result size (no N+1).
async function assemble(db: AppDatabase, rows: PatientRow[]): Promise<PatientWithRelations[]> {
  const patientIds = rows.map((row) => row.id);
  const [addresses, contactMethods] = await Promise.all([
    findAddressesByPatientIds(db, patientIds),
    findContactMethodsByPatientIds(db, patientIds),
  ]);
  const addressesByPatient = groupByPatientId(addresses);
  const contactsByPatient = groupByPatientId(contactMethods);
  return rows.map((row) => ({
    ...toPatient(row),
    addresses: addressesByPatient.get(row.id) ?? [],
    contactMethods: contactsByPatient.get(row.id) ?? [],
  }));
}

function groupByPatientId<T extends { patientId: string }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const existing = grouped.get(item.patientId);
    if (existing) existing.push(item);
    else grouped.set(item.patientId, [item]);
  }
  return grouped;
}

function toPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    firstName: decryptPhi(row.firstName),
    middleName: decryptNullablePhi(row.middleName),
    lastName: decryptPhi(row.lastName),
    dateOfBirth: row.dateOfBirth,
    status: row.status,
    hasInsurance: row.hasInsurance,
    archived: row.archived,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
