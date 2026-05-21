import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { AppDatabase } from '@/db/client';
import * as dbSchema from '@/db/schema';

// A real 32-byte key so the field-level cipher runs for real in tests (not a mock).
process.env.PHI_ENCRYPTION_KEY ??= '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

// Spin up an in-process Postgres (pglite) with the committed migrations applied. Repositories
// consume the concrete pglite db as the broader AppDatabase.
export async function createMigratedPgliteDb(): Promise<AppDatabase> {
  const pgliteDb = drizzle(new PGlite(), { schema: dbSchema });
  await migrate(pgliteDb, { migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)) });
  return pgliteDb;
}
