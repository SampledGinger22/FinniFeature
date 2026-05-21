import type { AppDatabase } from '@/db/client';
import { getDb } from '@/db/client';
import { patient } from '@/db/schema';
import { seedPatients } from '@/seed/seedData';
import type { SeedResult } from '@/seed/seedData';
import { purgeExpiredDeletes } from '@/services/patientService';

// Demo-only operations (spec §12). These would not exist in production — they exist so a
// reviewer can reset the dataset and exercise every state. Each takes an injectable db.

export interface BlankSlateResult {
  removed: number;
}

// Reseed: wipe + regenerate the deterministic faker dataset (seedPatients wipes first).
export async function reseedDemoData(db: AppDatabase = getDb()): Promise<SeedResult> {
  return seedPatients(db);
}

// Blank slate: wipe everything so every empty state renders at once. Cascade clears children.
export async function blankSlate(db: AppDatabase = getDb()): Promise<BlankSlateResult> {
  const removed = await db.delete(patient).returning({ id: patient.id });
  return { removed: removed.length };
}

// Purge: hard-delete records past the soft-delete window. Same logic the scheduled job would run.
export async function purgeExpired(db: AppDatabase = getDb()): Promise<number> {
  return purgeExpiredDeletes(db);
}
