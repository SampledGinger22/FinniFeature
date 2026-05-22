import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Applies versioned migrations from drizzle/ on a dedicated short-lived connection. Idempotent:
// migrate() records applied files in __drizzle_migrations and runs only new ones, so re-runs are safe.
const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'drizzle');

export async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  const sql = postgres(connectionString, { prepare: false, max: 1 });
  try {
    await migrate(drizzle(sql), { migrationsFolder });
  } finally {
    await sql.end();
  }
}
