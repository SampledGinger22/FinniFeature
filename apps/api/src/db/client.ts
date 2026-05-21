import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Driver-agnostic executor type: PgTransaction extends PgDatabase, so repository methods
// typed as AppDatabase accept either the pooled db or a transaction (and the pglite test db).
export type AppDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

let cached: AppDatabase | null = null;

// Lazy singleton — importing a repository must not require a live connection (tests inject
// their own pglite-backed db instead).
export function getDb(): AppDatabase {
  if (cached) return cached;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  cached = drizzle(postgres(connectionString), { schema });
  return cached;
}
