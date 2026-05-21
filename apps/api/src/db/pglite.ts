import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { AppDatabase } from '@/db/client';
import * as dbSchema from '@/db/schema';

const PHI_KEY_BYTES = 32;

// pglite is always in-process and fresh, so the PHI key only has to be consistent within this
// run. Honor a key from the environment if set, else generate an ephemeral one — so the cipher
// runs for real (tests + dev-server demo) with no key ever committed to the repo.
process.env.PHI_ENCRYPTION_KEY ??= randomBytes(PHI_KEY_BYTES).toString('hex');

// Spin up an in-process Postgres (pglite) with the committed migrations applied. Used by the
// repository tests and by the dev server when no DATABASE_URL is set (zero-config demo).
export async function createMigratedPgliteDb(): Promise<AppDatabase> {
  const pgliteDb = drizzle(new PGlite(), { schema: dbSchema });
  await migrate(pgliteDb, { migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)) });
  return pgliteDb;
}
