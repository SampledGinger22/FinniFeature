import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Driver-agnostic executor type: PgTransaction extends PgDatabase, so repository methods
// typed as AppDatabase accept either the pooled db or a transaction (and the pglite test db).
export type AppDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

let cached: AppDatabase | null = null;

// Serverless behind a pooled (pgbouncer transaction-mode) endpoint: disable prepared
// statements (named statements are unsupported there) and cap at one connection per instance.
const SERVERLESS_POOL_OPTIONS = { prepare: false, max: 1 } as const;

// Lazy singleton — importing a repository must not require a live connection (tests inject
// their own pglite-backed db instead).
export function getDb(): AppDatabase {
  if (cached) return cached;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  cached = drizzle(postgres(connectionString, SERVERLESS_POOL_OPTIONS), { schema });
  return cached;
}
