import { inArray } from 'drizzle-orm';
import type { Address, AddressType } from '@finni/shared';
import type { AppDatabase } from '@/db/client';
import { address } from '@/db/schema';
import { decryptNullablePhi, encryptNullablePhi } from '@/crypto/phiCipher';

type AddressRow = typeof address.$inferSelect;

export interface AddressInsert {
  id: string;
  patientId: string;
  type: AddressType;
  isPrimary: boolean;
  line1: string | null;
  line2: string | null;
  city: string | null;
  region: string;
  postalCode: string | null;
  country: string;
}

// Encrypt street-level PHI here (D39); city/region stay queryable.
export async function insertAddressRow(db: AppDatabase, values: AddressInsert): Promise<void> {
  await db.insert(address).values({
    id: values.id,
    patientId: values.patientId,
    type: values.type,
    isPrimary: values.isPrimary,
    line1: encryptNullablePhi(values.line1),
    line2: encryptNullablePhi(values.line2),
    city: values.city,
    region: values.region,
    postalCode: encryptNullablePhi(values.postalCode),
    country: values.country,
  });
}

export async function findAddressesByPatientIds(db: AppDatabase, patientIds: string[]): Promise<Address[]> {
  if (patientIds.length === 0) return [];
  const rows = await db.select().from(address).where(inArray(address.patientId, patientIds));
  return rows.map(toAddress);
}

function toAddress(row: AddressRow): Address {
  return {
    id: row.id,
    patientId: row.patientId,
    type: row.type,
    isPrimary: row.isPrimary,
    line1: decryptNullablePhi(row.line1),
    line2: decryptNullablePhi(row.line2),
    city: row.city,
    region: row.region,
    postalCode: decryptNullablePhi(row.postalCode),
    country: row.country,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
