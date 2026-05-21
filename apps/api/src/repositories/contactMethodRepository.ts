import { inArray } from 'drizzle-orm';
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
