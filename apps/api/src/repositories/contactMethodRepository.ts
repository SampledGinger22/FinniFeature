import { and, eq, inArray } from 'drizzle-orm';
import { DateTimeUtil } from '@finni/shared';
import type { ContactLabel, ContactMethod, ContactMethodType } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { contactMethod } from '@/db/schema';
import { decryptPhi, encryptPhi } from '@/crypto/phiCipher';

type ContactMethodRow = typeof contactMethod.$inferSelect;

export interface ContactMethodInsert {
  id: string;
  patientId: string;
  type: ContactMethodType;
  value: string;
  label: ContactLabel;
  isPrimary: boolean;
}

// The contact value is a direct identifier — always encrypted here (D39).
export async function insertContactMethodRow(db: AppDatabase, values: ContactMethodInsert): Promise<void> {
  await db.insert(contactMethod).values({
    id: values.id,
    patientId: values.patientId,
    type: values.type,
    value: encryptPhi(values.value),
    label: values.label,
    isPrimary: values.isPrimary,
  });
}

// First contact id of a given type for a patient — used to update the email or locate the phone.
export async function findContactIdByType(
  db: AppDatabase,
  patientId: string,
  type: ContactMethodType,
): Promise<string | null> {
  const rows = await db
    .select({ id: contactMethod.id })
    .from(contactMethod)
    .where(and(eq(contactMethod.patientId, patientId), eq(contactMethod.type, type)));
  return rows[0]?.id ?? null;
}

// The value is a direct identifier — re-encrypted on update (D39).
export async function updateContactValueRow(db: AppDatabase, id: string, value: string): Promise<void> {
  await db
    .update(contactMethod)
    .set({ value: encryptPhi(value), updatedAt: DateTimeUtil.nowUtc() })
    .where(eq(contactMethod.id, id));
}

export async function deleteContactMethodRow(db: AppDatabase, id: string): Promise<void> {
  await db.delete(contactMethod).where(eq(contactMethod.id, id));
}

export async function findContactMethodsByPatientIds(
  db: AppDatabase,
  patientIds: string[],
): Promise<ContactMethod[]> {
  if (patientIds.length === 0) return [];
  const rows = await db.select().from(contactMethod).where(inArray(contactMethod.patientId, patientIds));
  return rows.map(toContactMethod);
}

function toContactMethod(row: ContactMethodRow): ContactMethod {
  return {
    id: row.id,
    patientId: row.patientId,
    type: row.type,
    value: decryptPhi(row.value),
    label: row.label,
    isPrimary: row.isPrimary,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
