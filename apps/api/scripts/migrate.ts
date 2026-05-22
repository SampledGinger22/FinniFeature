import { runMigrations } from '@/db/migrator';

// CLI entry: apply pending migrations to DATABASE_URL, then exit.
async function runMigrateCli(): Promise<void> {
  await runMigrations();
  console.log('Migrations applied.');
  process.exit(0);
}

runMigrateCli().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
